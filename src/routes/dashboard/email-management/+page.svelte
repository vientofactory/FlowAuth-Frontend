<script lang="ts">
	import {
		DashboardLayout,
		Tabs,
		apiClient,
		useToast,
		LoadingSpinner,
		ConfirmModal,
		authState,
		Button
	} from '$lib';
	import { onMount } from 'svelte';
	import { usePermissions } from '$lib/composables/usePermissions';
	import type { User } from '$lib';

	// 새로운 컴포넌트들 import
	import {
		QueueStatusCards,
		QuickActions,
		QueueTable,
		TestSection,
		SmtpStatusCard,
		TestEmailModal
	} from '$lib';

	// 이메일 시스템 상태 타입 정의
	interface EmailQueueStats {
		active: number;
		waiting: number;
		completed: number;
		failed: number;
		delayed: number;
		paused: number;
	}

	interface TestEmailRequest {
		to: string;
		templateName: string;
		username: string;
	}

	let _user = $state<User | null>(null);
	let isLoading = $state(true);
	let isProcessing = $state(false);
	let queueStats = $state<EmailQueueStats>({
		active: 0,
		waiting: 0,
		completed: 0,
		failed: 0,
		delayed: 0,
		paused: 0
	});

	// 낙관적 업데이트를 위한 임시 상태
	let optimisticQueueStats = $state<EmailQueueStats>({
		active: 0,
		waiting: 0,
		completed: 0,
		failed: 0,
		delayed: 0,
		paused: 0
	});

	// 낙관적 업데이트 활성 상태 추적
	let pendingOperations = $state<Set<string>>(new Set());

	// SMTP 연결 상태
	interface SMTPInfo {
		connected: boolean;
		host: string;
		port: number;
		auth: string;
		secure: boolean;
		lastChecked: string;
	}

	let smtpStatus = $state<SMTPInfo | null>(null);

	// 테스트 이메일 폼
	let _testEmailForm = $state<TestEmailRequest>({
		to: '',
		templateName: 'welcome',
		username: ''
	});

	// 모달 상태
	let showConfirmModal = $state(false);
	let showTestEmailModal = $state(false);
	let confirmAction: (() => Promise<void>) | null = null;
	let confirmTitle = $state('');
	let confirmMessage = $state('');

	// 설정 상태
	let _emailSettings = $state({
		queueCleanInterval: 60,
		maxRetryAttempts: 3,
		defaultJobPriority: 5,
		jobTimeout: 120,
		enableMetrics: true,
		enableNotifications: true
	});

	// 권한 체크
	const { canManageSystem } = usePermissions();

	const toast = useToast();

	// 탭 설정
	const tabs = [
		{ id: 'overview', label: '개요', icon: 'fas fa-tachometer-alt' },
		{ id: 'queue', label: '큐 관리', icon: 'fas fa-list' },
		{ id: 'test', label: '테스트', icon: 'fas fa-envelope' },
		{ id: 'settings', label: '설정', icon: 'fas fa-cog' }
	];

	let activeTab = $state('overview');

	// 자동 새로고침 설정
	let autoRefresh = $state(true);
	let refreshInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		const unsubscribe = authState.subscribe((state) => {
			_user = state.user;
			isLoading = state.isLoading;

			// 관리자 권한 체크
			if (state.isInitialized && !state.isLoading) {
				if (!$canManageSystem) {
					// 권한이 없으면 대시보드로 리다이렉트
					window.location.href = '/dashboard';
					return;
				}

				// 초기 낙관적 상태 설정
				optimisticQueueStats = { ...queueStats };
				loadEmailSystemData();
			}
		});

		// 자동 새로고침 설정 (30초마다)
		if (autoRefresh) {
			refreshInterval = setInterval(() => {
				loadQueueStats();
				refreshSmtpStatus();
			}, 30000);
		}

		return () => {
			unsubscribe();
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function loadEmailSystemData() {
		try {
			isLoading = true;
			await Promise.all([loadQueueStats(), refreshSmtpStatus()]);
		} finally {
			isLoading = false;
		}
	}

	// 낙관적 업데이트를 위한 헬퍼 함수들
	function applyOptimisticUpdate(
		operationId: string,
		updateFn: (stats: EmailQueueStats) => EmailQueueStats
	) {
		pendingOperations.add(operationId);
		optimisticQueueStats = updateFn({ ...optimisticQueueStats });
	}

	function revertOptimisticUpdate(operationId: string) {
		pendingOperations.delete(operationId);
		optimisticQueueStats = { ...queueStats };
	}

	function completeOptimisticUpdate(operationId: string) {
		pendingOperations.delete(operationId);
	}

	async function loadQueueStats() {
		try {
			const response = await apiClient.getEmailQueueStats();
			queueStats = response;
			// 진행 중인 낙관적 업데이트가 없을 때만 optimisticQueueStats 업데이트
			if (pendingOperations.size === 0) {
				optimisticQueueStats = { ...response };
			}
		} catch (error) {
			console.error('Failed to load queue stats:', error);
			toast.error('큐 상태를 불러오는데 실패했습니다.');
		}
	}

	async function refreshSmtpStatus() {
		try {
			const response = await apiClient.getSmtpInfo();
			smtpStatus = response;
		} catch (error) {
			console.error('Failed to get SMTP info:', error);
			// 에러 시 기본값 설정
			smtpStatus = {
				connected: false,
				host: 'Unknown',
				port: 587,
				auth: '없음',
				secure: false,
				lastChecked: new Date().toISOString()
			};
		}
	}

	async function retryFailedJobs() {
		const operationId = 'retryFailed';

		// 낙관적 업데이트: 실패한 작업들을 대기 상태로 이동
		const failedCount = optimisticQueueStats.failed;

		// 즉시 성공 피드백 표시
		toast.info(`${failedCount}개의 실패한 작업을 재시도 중입니다...`);

		applyOptimisticUpdate(operationId, (stats) => ({
			...stats,
			failed: 0,
			waiting: stats.waiting + failedCount
		}));

		try {
			isProcessing = true;
			const response = await apiClient.retryFailedEmailJobs();
			toast.success(`${response.retriedCount}개의 실패한 작업을 재시도했습니다.`);

			// 서버에서 실제 상태 가져오기
			await loadQueueStats();
			completeOptimisticUpdate(operationId);
		} catch (error) {
			console.error('Failed to retry failed jobs:', error);
			toast.error('실패한 작업 재시도에 실패했습니다.');

			// 실패 시 낙관적 업데이트 롤백
			revertOptimisticUpdate(operationId);
		} finally {
			isProcessing = false;
		}
	}

	async function cleanQueue() {
		const operationId = 'cleanQueue';

		// 즉시 피드백 표시
		toast.info('큐 정리를 시작합니다...');

		// 낙관적 업데이트: 완료된 작업과 일부 실패한 작업 제거
		applyOptimisticUpdate(operationId, (stats) => ({
			...stats,
			completed: 0,
			failed: Math.max(0, Math.floor(stats.failed * 0.3)) // 일부만 남김
		}));

		try {
			isProcessing = true;
			const response = await apiClient.cleanEmailQueue();

			// 구체적인 정리 결과 표시
			if (response.totalCleaned > 0) {
				toast.success(
					`큐 정리 완료: ${response.totalCleaned}개 작업 제거 (완료: ${response.cleanedCompleted}, 실패: ${response.cleanedFailed})`
				);
			} else {
				toast.info('정리할 작업이 없습니다.');
			}

			// 서버에서 실제 상태 가져오기
			await loadQueueStats();
			completeOptimisticUpdate(operationId);
		} catch (error) {
			console.error('Failed to clean queue:', error);
			toast.error('큐 정리에 실패했습니다.');

			// 실패 시 낙관적 업데이트 롤백
			revertOptimisticUpdate(operationId);
		} finally {
			isProcessing = false;
		}
	}

	async function pauseQueue() {
		const operationId = 'pauseQueue';

		// 즉시 피드백 표시
		toast.success('이메일 큐가 일시정지되었습니다.');

		// 낙관적 업데이트: 큐를 일시정지 상태로 설정
		applyOptimisticUpdate(operationId, (stats) => ({
			...stats,
			paused: 1
		}));

		try {
			isProcessing = true;
			await apiClient.pauseEmailQueue();

			// 서버에서 실제 상태 가져오기
			await loadQueueStats();
			completeOptimisticUpdate(operationId);
		} catch (error) {
			console.error('Failed to pause queue:', error);
			toast.error('큐 일시정지에 실패했습니다. 상태를 복원합니다.');

			// 실패 시 낙관적 업데이트 롤백
			revertOptimisticUpdate(operationId);
		} finally {
			isProcessing = false;
		}
	}

	async function resumeQueue() {
		const operationId = 'resumeQueue';

		// 즉시 피드백 표시
		toast.success('이메일 큐가 재개되었습니다.');

		// 낙관적 업데이트: 큐를 실행 상태로 설정
		applyOptimisticUpdate(operationId, (stats) => ({
			...stats,
			paused: 0 // 큐 실행 상태 = 0
		}));

		try {
			isProcessing = true;
			await apiClient.resumeEmailQueue();

			// 서버에서 실제 상태 가져오기
			await loadQueueStats();
			completeOptimisticUpdate(operationId);
		} catch (error) {
			console.error('Failed to resume queue:', error);
			toast.error('큐 재개에 실패했습니다. 상태를 복원합니다.');

			// 실패 시 낙관적 업데이트 롤백
			revertOptimisticUpdate(operationId);
		} finally {
			isProcessing = false;
		}
	}

	async function purgeQueue() {
		const operationId = 'purgeQueue';

		// 즉시 피드백 표시
		toast.warning('모든 큐 작업을 제거하는 중...');

		// 낙관적 업데이트: 모든 큐 작업 제거
		applyOptimisticUpdate(operationId, () => ({
			active: 0,
			waiting: 0,
			completed: 0,
			failed: 0,
			delayed: 0,
			paused: 0
		}));

		try {
			isProcessing = true;
			await apiClient.purgeEmailQueue();
			toast.success('모든 큐 작업이 제거되었습니다.');

			// 서버에서 실제 상태 가져오기
			await loadQueueStats();
			completeOptimisticUpdate(operationId);
		} catch (error) {
			console.error('Failed to purge queue:', error);
			toast.error('큐 비우기에 실패했습니다. 상태를 복원합니다.');

			// 실패 시 낙관적 업데이트 롤백
			revertOptimisticUpdate(operationId);
		} finally {
			isProcessing = false;
		}
	}

	async function handleTestEmailSubmit(form: TestEmailRequest) {
		try {
			isProcessing = true;
			const response = await apiClient.sendTestEmail(form);
			toast.success(response.message);
		} catch (error) {
			console.error('Failed to send test email:', error);
			toast.error('테스트 이메일 전송에 실패했습니다.');
		} finally {
			isProcessing = false;
		}
	}

	function showConfirm(title: string, message: string, action: () => Promise<void>) {
		confirmTitle = title;
		confirmMessage = message;
		confirmAction = action;
		showConfirmModal = true;
	}

	async function handleConfirm() {
		if (confirmAction) {
			await confirmAction();
		}
		showConfirmModal = false;
	}

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh && !refreshInterval) {
			refreshInterval = setInterval(() => {
				loadQueueStats();
				refreshSmtpStatus();
			}, 30000);
		} else if (!autoRefresh && refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	async function _handleSettingsSave(settings: typeof _emailSettings) {
		try {
			isProcessing = true;
			// 실제 설정 저장 API 호출
			// await apiClient.saveEmailSettings(settings);
			_emailSettings = { ...settings };
			toast.success('설정이 저장되었습니다.');
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast.error('설정 저장에 실패했습니다.');
		} finally {
			isProcessing = false;
		}
	}
</script>

<DashboardLayout
	title="이메일 시스템 관리"
	description="이메일 큐와 SMTP 설정을 모니터링하고 관리합니다."
>
	{#if !$canManageSystem}
		<div class="rounded-lg bg-red-50 p-6 text-center">
			<i class="fas fa-exclamation-triangle mb-2 text-4xl text-red-500"></i>
			<h2 class="mb-2 text-xl font-semibold text-red-800">접근 권한이 없습니다</h2>
			<p class="text-red-600">이 페이지에 접근하려면 시스템 관리자 권한이 필요합니다.</p>
		</div>
	{:else if isLoading}
		<div class="flex items-center justify-center py-12">
			<LoadingSpinner size="lg" />
		</div>
	{:else}
		<!-- 상단 컨트롤 -->
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<Button
					variant="outline"
					onclick={loadEmailSystemData}
					disabled={isProcessing}
					class="transition-colors hover:border-stone-200 hover:bg-stone-50"
				>
					<i class="fas fa-sync-alt mr-2"></i>
					새로고침
				</Button>

				<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
					<input
						type="checkbox"
						bind:checked={autoRefresh}
						onchange={toggleAutoRefresh}
						class="h-4 w-4 rounded border-gray-300 text-stone-600 focus:ring-stone-500"
					/>
					자동 새로고침 (30초)
				</label>
			</div>

			<!-- SMTP 연결 상태 요약 -->
			<div class="flex items-center gap-2 text-sm">
				{#if smtpStatus}
					<div class="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 backdrop-blur-sm">
						<div
							class="h-3 w-3 rounded-full {smtpStatus.connected ? 'bg-green-500' : 'bg-red-500'}"
						></div>
						<span class="font-medium text-gray-700">SMTP:</span>
						<span class={smtpStatus.connected ? 'text-green-600' : 'text-red-600'}>
							{smtpStatus.connected ? '연결됨' : '연결 실패'}
						</span>
					</div>
				{:else}
					<span class="text-gray-500">SMTP 상태 확인 중...</span>
				{/if}
			</div>
		</div>

		<!-- 탭 인터페이스 -->
		<div class="overflow-hidden rounded-xl bg-white shadow-lg">
			<Tabs {tabs} bind:activeTab>
				{#snippet children({ activeTab })}
					<div class="p-6">
						{#if activeTab === 'overview'}
							<!-- 개요 탭 -->
							<div class="space-y-6">
								<h3 class="text-lg font-semibold text-gray-900">시스템 개요</h3>

								<!-- 큐 상태 카드들 -->
								<QueueStatusCards
									queueStats={optimisticQueueStats}
									pendingOperations={Array.from(pendingOperations)}
								/>

								<!-- 빠른 작업 -->
								<QuickActions
									queueStats={optimisticQueueStats}
									{isProcessing}
									pendingOperations={Array.from(pendingOperations)}
									onRetryFailed={() =>
										showConfirm(
											'실패한 작업 재시도',
											'모든 실패한 이메일 작업을 재시도하시겠습니까?',
											retryFailedJobs
										)}
									onCleanQueue={() =>
										showConfirm(
											'큐 정리',
											'완료된 작업과 오래된 실패 작업을 정리하시겠습니까?',
											cleanQueue
										)}
									onPauseQueue={() =>
										showConfirm(
											'큐 일시정지',
											'이메일 큐 처리를 일시정지하시겠습니까?',
											pauseQueue
										)}
									onResumeQueue={() =>
										showConfirm('큐 재개', '이메일 큐 처리를 재개하시겠습니까?', resumeQueue)}
								/>
							</div>
						{:else if activeTab === 'queue'}
							<!-- 큐 관리 탭 -->
							<div class="space-y-6">
								<h3 class="text-lg font-semibold text-gray-900">큐 관리</h3>

								<!-- 큐 상태 테이블 -->
								<QueueTable
									queueStats={optimisticQueueStats}
									pendingOperations={Array.from(pendingOperations)}
								/>

								<!-- 큐 제어 -->
								<div class="space-y-4">
									<h4 class="text-lg font-medium text-gray-900">큐 제어</h4>
									<QuickActions
										queueStats={optimisticQueueStats}
										{isProcessing}
										pendingOperations={Array.from(pendingOperations)}
										showAdvanced={true}
										onRetryFailed={() =>
											showConfirm(
												'실패한 작업 재시도',
												`${optimisticQueueStats.failed}개의 실패한 작업을 재시도하시겠습니까?`,
												retryFailedJobs
											)}
										onCleanQueue={() =>
											showConfirm(
												'큐 정리',
												'완료된 작업과 24시간 이상 된 실패 작업을 정리하시겠습니까?',
												cleanQueue
											)}
										onPauseQueue={() =>
											showConfirm(
												'큐 일시정지',
												'이메일 큐 처리를 일시정지하시겠습니까? 새로운 작업은 대기 상태가 됩니다.',
												pauseQueue
											)}
										onResumeQueue={() =>
											showConfirm(
												'큐 재개',
												'이메일 큐 처리를 재개하시겠습니까? 대기 중인 작업들이 처리됩니다.',
												resumeQueue
											)}
										onPurgeQueue={() =>
											showConfirm(
												'큐 완전 비우기',
												'⚠️ 경고: 모든 큐 작업(대기, 실패, 지연 포함)이 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
												purgeQueue
											)}
									/>
								</div>
							</div>
						{:else if activeTab === 'test'}
							<!-- 테스트 탭 -->
							<div class="space-y-6">
								<h3 class="text-lg font-semibold text-gray-900">이메일 테스트</h3>

								<!-- SMTP 상태 카드 -->
								<SmtpStatusCard
									{smtpStatus}
									onRefresh={refreshSmtpStatus}
									isRefreshing={isProcessing}
								/>

								<!-- 테스트 섹션 -->
								<TestSection
									onSendTest={() => {
										showTestEmailModal = true;
									}}
								/>
							</div>
						{:else if activeTab === 'settings'}
							<!-- 설정 탭 -->
							<div class="space-y-6">
								<h3 class="text-lg font-semibold text-gray-900">이메일 시스템 설정</h3>

								<!-- 자동 새로고침 설정 -->
								<div
									class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
								>
									<div class="relative">
										<h4 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
											<div
												class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100"
											>
												<i class="fas fa-cog text-stone-600"></i>
											</div>
											자동 새로고침 설정
										</h4>
										<div class="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
											<label class="flex items-center gap-3">
												<input
													type="checkbox"
													bind:checked={autoRefresh}
													onchange={toggleAutoRefresh}
													class="h-4 w-4 rounded border-gray-300 text-stone-600 focus:ring-stone-500"
												/>
												<span class="text-sm text-gray-700">30초마다 자동으로 큐 상태 새로고침</span
												>
											</label>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/snippet}
			</Tabs>
		</div>
	{/if}

	<!-- 확인 모달 -->
	<ConfirmModal
		open={showConfirmModal}
		title={confirmTitle}
		message={confirmMessage}
		confirmText="확인"
		cancelText="취소"
		onConfirm={handleConfirm}
		onCancel={() => {
			showConfirmModal = false;
		}}
	/>

	<!-- 테스트 이메일 모달 -->
	<TestEmailModal
		isOpen={showTestEmailModal}
		onClose={() => {
			showTestEmailModal = false;
		}}
		onSubmit={handleTestEmailSubmit}
		{isProcessing}
	/>
</DashboardLayout>
