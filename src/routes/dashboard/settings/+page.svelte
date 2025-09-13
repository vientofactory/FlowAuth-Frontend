<script lang="ts">
	import { Card, Button, Input, Badge, Loading, Modal, Tabs } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	// 설정 상태
	let generalSettings = $state({
		siteName: 'FlowAuth',
		siteDescription: 'OAuth2 인증 시스템',
		adminEmail: 'admin@flowauth.com',
		defaultTokenExpiry: 3600,
		defaultRefreshTokenExpiry: 86400 * 30
	});

	let securitySettings = $state({
		enableTwoFactor: false,
		requireStrongPasswords: true,
		enableLoginNotifications: true,
		sessionTimeout: 1800,
		maxLoginAttempts: 5,
		enableAuditLog: true
	});

	let notificationSettings = $state({
		emailNotifications: true,
		newClientNotifications: true,
		tokenExpiryNotifications: true,
		securityAlerts: true,
		systemUpdates: false
	});

	let apiSettings = $state({
		rateLimit: 1000,
		enableCors: true,
		corsOrigins: 'https://example.com, https://app.example.com',
		enableWebhooks: false,
		webhookUrl: ''
	});

	// 백업/복원 설정
	let backupSettings = $state({
		autoBackup: true,
		backupFrequency: 'daily',
		retentionDays: 30,
		lastBackup: new Date(Date.now() - 86400000) // 1일 전
	});

	// 로딩 상태
	let isSaving = $state(false);
	let isBackingUp = $state(false);
	let isRestoring = $state(false);

	// 모달 상태
	let showBackupModal = $state(false);
	let showRestoreModal = $state(false);
	let showResetModal = $state(false);

	const toast = useToast();

	// 탭 설정
	const tabs = [
		{ id: 'general', label: '일반', icon: 'fas fa-cog' },
		{ id: 'security', label: '보안', icon: 'fas fa-shield-alt' },
		{ id: 'notifications', label: '알림', icon: 'fas fa-bell' },
		{ id: 'api', label: 'API', icon: 'fas fa-code' },
		{ id: 'backup', label: '백업/복원', icon: 'fas fa-download' }
	];

	let activeTab = $state('general');

	onMount(async () => {
		await authStore.initialize();

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		await loadSettings();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 인증 상태에 따른 리다이렉트 처리
	$effect(() => {
		if (!isLoading && !isAuthenticated) {
			window.location.href = '/auth/login';
		}
	});

	async function loadSettings() {
		try {
			// TODO: API 호출로 실제 설정 불러오기
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 현재는 더미 데이터 사용
			toast.success('설정을 불러왔습니다.');
		} catch (error) {
			console.error('Failed to load settings:', error);
			toast.error('설정을 불러오는데 실패했습니다.');
		}
	}

	async function saveSettings() {
		isSaving = true;
		try {
			// TODO: API 호출로 설정 저장
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			toast.success('설정이 성공적으로 저장되었습니다.');
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast.error('설정 저장에 실패했습니다.');
		} finally {
			isSaving = false;
		}
	}

	async function createBackup() {
		isBackingUp = true;
		try {
			// TODO: API 호출로 백업 생성
			await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

			backupSettings.lastBackup = new Date();
			showBackupModal = false;
			toast.success('백업이 성공적으로 생성되었습니다.');
		} catch (error) {
			console.error('Failed to create backup:', error);
			toast.error('백업 생성에 실패했습니다.');
		} finally {
			isBackingUp = false;
		}
	}

	async function restoreFromBackup() {
		isRestoring = true;
		try {
			// TODO: API 호출로 백업 복원
			await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이

			showRestoreModal = false;
			toast.success('백업이 성공적으로 복원되었습니다.');
		} catch (error) {
			console.error('Failed to restore backup:', error);
			toast.error('백업 복원에 실패했습니다.');
		} finally {
			isRestoring = false;
		}
	}

	async function resetSettings() {
		try {
			// TODO: API 호출로 설정 초기화
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 설정을 기본값으로 리셋
			generalSettings = {
				siteName: 'FlowAuth',
				siteDescription: 'OAuth2 인증 시스템',
				adminEmail: 'admin@flowauth.com',
				defaultTokenExpiry: 3600,
				defaultRefreshTokenExpiry: 86400 * 30
			};

			securitySettings = {
				enableTwoFactor: false,
				requireStrongPasswords: true,
				enableLoginNotifications: true,
				sessionTimeout: 1800,
				maxLoginAttempts: 5,
				enableAuditLog: true
			};

			notificationSettings = {
				emailNotifications: true,
				newClientNotifications: true,
				tokenExpiryNotifications: true,
				securityAlerts: true,
				systemUpdates: false
			};

			apiSettings = {
				rateLimit: 1000,
				enableCors: true,
				corsOrigins: 'https://example.com, https://app.example.com',
				enableWebhooks: false,
				webhookUrl: ''
			};

			showResetModal = false;
			toast.success('설정이 기본값으로 초기화되었습니다.');
		} catch (error) {
			console.error('Failed to reset settings:', error);
			toast.error('설정 초기화에 실패했습니다.');
		}
	}

	function navigateBack() {
		window.location.href = '/dashboard';
	}

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	// 토글 핸들러
	function toggleSetting(settingsObj: any, key: string) {
		settingsObj[key] = !settingsObj[key];
	}
</script>

<svelte:head>
	<title>설정 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="설정을 불러오는 중..." />
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={navigateBack}
							class="text-gray-600 hover:text-gray-900"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							대시보드로
						</Button>
						<div class="h-6 w-px bg-gray-300"></div>
						<h1 class="text-xl font-semibold text-gray-900">시스템 설정</h1>
					</div>
					<div class="flex items-center space-x-4">
						<div class="hidden sm:block">
							<span class="text-sm text-gray-600">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<Button onclick={saveSettings} disabled={isSaving}>
							{#if isSaving}
								<Loading variant="spinner" size="sm" class="mr-2" />
							{:else}
								<i class="fas fa-save mr-2"></i>
							{/if}
							설정 저장
						</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={handleLogout}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-sign-out-alt mr-2"></i>
							로그아웃
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 페이지 헤더 -->
				<div>
					<h2 class="text-2xl font-bold text-gray-900">시스템 설정</h2>
					<p class="mt-1 text-sm text-gray-600">
						FlowAuth 시스템의 전반적인 설정을 관리하세요.
					</p>
				</div>

				<!-- 설정 탭 -->
				<Card>
					<Tabs {tabs} bind:activeTab>
						{#snippet children({ activeTab })}
							{#if activeTab === 'general'}
								<!-- 일반 설정 탭 -->
								<div class="space-y-6">
									<h3 class="text-lg font-semibold text-gray-900">일반 설정</h3>

									<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div>
											<label for="siteName" class="block text-sm font-medium text-gray-700 mb-2">
												사이트 이름
											</label>
											<Input
												id="siteName"
												value={generalSettings.siteName}
												placeholder="FlowAuth"
												oninput={(e) => {
													generalSettings.siteName = (e.target as HTMLInputElement).value;
												}}
											/>
										</div>

										<div>
											<label for="adminEmail" class="block text-sm font-medium text-gray-700 mb-2">
												관리자 이메일
											</label>
											<Input
												id="adminEmail"
												type="email"
												value={generalSettings.adminEmail}
												placeholder="admin@flowauth.com"
												oninput={(e) => {
													generalSettings.adminEmail = (e.target as HTMLInputElement).value;
												}}
											/>
										</div>

										<div>
											<label for="defaultTokenExpiry" class="block text-sm font-medium text-gray-700 mb-2">
												기본 토큰 만료 시간 (초)
											</label>
											<Input
												id="defaultTokenExpiry"
												type="number"
												value={generalSettings.defaultTokenExpiry.toString()}
												placeholder="3600"
												oninput={(e) => {
													generalSettings.defaultTokenExpiry = parseInt((e.target as HTMLInputElement).value) || 3600;
												}}
											/>
										</div>

										<div>
											<label for="defaultRefreshTokenExpiry" class="block text-sm font-medium text-gray-700 mb-2">
												기본 리프레시 토큰 만료 시간 (초)
											</label>
											<Input
												id="defaultRefreshTokenExpiry"
												type="number"
												value={generalSettings.defaultRefreshTokenExpiry.toString()}
												placeholder="2592000"
												oninput={(e) => {
													generalSettings.defaultRefreshTokenExpiry = parseInt((e.target as HTMLInputElement).value) || 2592000;
												}}
											/>
										</div>
									</div>

									<div>
										<label for="siteDescription" class="block text-sm font-medium text-gray-700 mb-2">
											사이트 설명
										</label>
										<Input
											id="siteDescription"
											value={generalSettings.siteDescription}
											placeholder="OAuth2 인증 시스템"
											oninput={(e) => {
												generalSettings.siteDescription = (e.target as HTMLInputElement).value;
											}}
										/>
									</div>
								</div>
							{:else if activeTab === 'security'}
								<!-- 보안 설정 탭 -->
								<div class="space-y-6">
									<h3 class="text-lg font-semibold text-gray-900">보안 설정</h3>

									<div class="space-y-4">
										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">이중 인증 (2FA)</p>
												<p class="text-sm text-gray-600">추가 보안을 위한 이중 인증 활성화</p>
											</div>
											<Button
												variant={securitySettings.enableTwoFactor ? "primary" : "outline"}
												onclick={() => toggleSetting(securitySettings, 'enableTwoFactor')}
											>
												{securitySettings.enableTwoFactor ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">강력한 비밀번호 필수</p>
												<p class="text-sm text-gray-600">복잡한 비밀번호 규칙 적용</p>
											</div>
											<Button
												variant={securitySettings.requireStrongPasswords ? "primary" : "outline"}
												onclick={() => toggleSetting(securitySettings, 'requireStrongPasswords')}
											>
												{securitySettings.requireStrongPasswords ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">로그인 알림</p>
												<p class="text-sm text-gray-600">새로운 기기에서 로그인 시 알림</p>
											</div>
											<Button
												variant={securitySettings.enableLoginNotifications ? "primary" : "outline"}
												onclick={() => toggleSetting(securitySettings, 'enableLoginNotifications')}
											>
												{securitySettings.enableLoginNotifications ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">감사 로그</p>
												<p class="text-sm text-gray-600">시스템 활동 로그 기록</p>
											</div>
											<Button
												variant={securitySettings.enableAuditLog ? "primary" : "outline"}
												onclick={() => toggleSetting(securitySettings, 'enableAuditLog')}
											>
												{securitySettings.enableAuditLog ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>
									</div>

									<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div>
											<label for="sessionTimeout" class="block text-sm font-medium text-gray-700 mb-2">
												세션 타임아웃 (초)
											</label>
											<Input
												id="sessionTimeout"
												type="number"
												value={securitySettings.sessionTimeout.toString()}
												placeholder="1800"
												oninput={(e) => {
													securitySettings.sessionTimeout = parseInt((e.target as HTMLInputElement).value) || 1800;
												}}
											/>
										</div>

										<div>
											<label for="maxLoginAttempts" class="block text-sm font-medium text-gray-700 mb-2">
												최대 로그인 시도 횟수
											</label>
											<Input
												id="maxLoginAttempts"
												type="number"
												value={securitySettings.maxLoginAttempts.toString()}
												placeholder="5"
												oninput={(e) => {
													securitySettings.maxLoginAttempts = parseInt((e.target as HTMLInputElement).value) || 5;
												}}
											/>
										</div>
									</div>
								</div>
							{:else if activeTab === 'notifications'}
								<!-- 알림 설정 탭 -->
								<div class="space-y-6">
									<h3 class="text-lg font-semibold text-gray-900">알림 설정</h3>

									<div class="space-y-4">
										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">이메일 알림</p>
												<p class="text-sm text-gray-600">이메일을 통한 알림 수신</p>
											</div>
											<Button
												variant={notificationSettings.emailNotifications ? "primary" : "outline"}
												onclick={() => toggleSetting(notificationSettings, 'emailNotifications')}
											>
												{notificationSettings.emailNotifications ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">새 클라이언트 알림</p>
												<p class="text-sm text-gray-600">새로운 OAuth2 클라이언트 등록 시 알림</p>
											</div>
											<Button
												variant={notificationSettings.newClientNotifications ? "primary" : "outline"}
												onclick={() => toggleSetting(notificationSettings, 'newClientNotifications')}
											>
												{notificationSettings.newClientNotifications ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">토큰 만료 알림</p>
												<p class="text-sm text-gray-600">토큰 만료 임박 시 알림</p>
											</div>
											<Button
												variant={notificationSettings.tokenExpiryNotifications ? "primary" : "outline"}
												onclick={() => toggleSetting(notificationSettings, 'tokenExpiryNotifications')}
											>
												{notificationSettings.tokenExpiryNotifications ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">보안 경고</p>
												<p class="text-sm text-gray-600">보안 관련 이벤트 알림</p>
											</div>
											<Button
												variant={notificationSettings.securityAlerts ? "primary" : "outline"}
												onclick={() => toggleSetting(notificationSettings, 'securityAlerts')}
											>
												{notificationSettings.securityAlerts ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">시스템 업데이트</p>
												<p class="text-sm text-gray-600">시스템 업데이트 관련 알림</p>
											</div>
											<Button
												variant={notificationSettings.systemUpdates ? "primary" : "outline"}
												onclick={() => toggleSetting(notificationSettings, 'systemUpdates')}
											>
												{notificationSettings.systemUpdates ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>
									</div>
								</div>
							{:else if activeTab === 'api'}
								<!-- API 설정 탭 -->
								<div class="space-y-6">
									<h3 class="text-lg font-semibold text-gray-900">API 설정</h3>

									<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div>
											<label for="rateLimit" class="block text-sm font-medium text-gray-700 mb-2">
												요청 제한 (시간당)
											</label>
											<Input
												id="rateLimit"
												type="number"
												value={apiSettings.rateLimit.toString()}
												placeholder="1000"
												oninput={(e) => {
													apiSettings.rateLimit = parseInt((e.target as HTMLInputElement).value) || 1000;
												}}
											/>
										</div>

										<div>
											<label for="corsOrigins" class="block text-sm font-medium text-gray-700 mb-2">
												CORS 허용 도메인
											</label>
											<Input
												id="corsOrigins"
												value={apiSettings.corsOrigins}
												placeholder="https://example.com, https://app.example.com"
												oninput={(e) => {
													apiSettings.corsOrigins = (e.target as HTMLInputElement).value;
												}}
											/>
										</div>
									</div>

									<div class="space-y-4">
										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">CORS 활성화</p>
												<p class="text-sm text-gray-600">Cross-Origin Resource Sharing 허용</p>
											</div>
											<Button
												variant={apiSettings.enableCors ? "primary" : "outline"}
												onclick={() => toggleSetting(apiSettings, 'enableCors')}
											>
												{apiSettings.enableCors ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>

										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div>
												<p class="font-medium text-gray-900">웹훅 활성화</p>
												<p class="text-sm text-gray-600">이벤트 발생 시 웹훅 전송</p>
											</div>
											<Button
												variant={apiSettings.enableWebhooks ? "primary" : "outline"}
												onclick={() => toggleSetting(apiSettings, 'enableWebhooks')}
											>
												{apiSettings.enableWebhooks ? '활성화됨' : '비활성화됨'}
											</Button>
										</div>
									</div>

									{#if apiSettings.enableWebhooks}
										<div>
											<label for="webhookUrl" class="block text-sm font-medium text-gray-700 mb-2">
												웹훅 URL
											</label>
											<Input
												id="webhookUrl"
												value={apiSettings.webhookUrl}
												placeholder="https://example.com/webhook"
												oninput={(e) => {
													apiSettings.webhookUrl = (e.target as HTMLInputElement).value;
												}}
											/>
										</div>
									{/if}
								</div>
							{:else if activeTab === 'backup'}
								<!-- 백업/복원 설정 탭 -->
								<div class="space-y-6">
									<h3 class="text-lg font-semibold text-gray-900">백업 및 복원</h3>

									<!-- 자동 백업 설정 -->
									<Card class="border-l-4 border-l-blue-500">
										<h4 class="mb-4 text-lg font-semibold text-gray-900">자동 백업</h4>
										
										<div class="space-y-4">
											<div class="flex items-center justify-between">
												<div>
													<p class="font-medium text-gray-900">자동 백업 활성화</p>
													<p class="text-sm text-gray-600">정기적으로 자동 백업 생성</p>
												</div>
												<Button
													variant={backupSettings.autoBackup ? "primary" : "outline"}
													onclick={() => toggleSetting(backupSettings, 'autoBackup')}
												>
													{backupSettings.autoBackup ? '활성화됨' : '비활성화됨'}
												</Button>
											</div>

											<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div>
													<label for="backupFrequency" class="block text-sm font-medium text-gray-700 mb-2">백업 주기</label>
													<select 
														id="backupFrequency"
														class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
														bind:value={backupSettings.backupFrequency}
													>
														<option value="daily">매일</option>
														<option value="weekly">매주</option>
														<option value="monthly">매월</option>
													</select>
												</div>

												<div>
													<label for="retentionDays" class="block text-sm font-medium text-gray-700 mb-2">
														보관 기간 (일)
													</label>
													<Input
														id="retentionDays"
														type="number"
														value={backupSettings.retentionDays.toString()}
														placeholder="30"
														oninput={(e) => {
															backupSettings.retentionDays = parseInt((e.target as HTMLInputElement).value) || 30;
														}}
													/>
												</div>
											</div>

											<div class="rounded-lg bg-gray-50 p-4">
												<p class="text-sm text-gray-600 mb-1">마지막 백업:</p>
												<p class="text-sm font-medium text-gray-900">
													{backupSettings.lastBackup.toLocaleString('ko-KR')}
												</p>
											</div>
										</div>
									</Card>

									<!-- 수동 백업/복원 -->
									<Card>
										<h4 class="mb-4 text-lg font-semibold text-gray-900">수동 백업 및 복원</h4>
										
										<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<Button onclick={() => showBackupModal = true} class="h-20 flex-col">
												<i class="fas fa-download text-2xl mb-2"></i>
												<span>백업 생성</span>
											</Button>

											<Button 
												variant="outline" 
												onclick={() => showRestoreModal = true}
												class="h-20 flex-col border-dashed"
											>
												<i class="fas fa-upload text-2xl mb-2"></i>
												<span>백업 복원</span>
											</Button>
										</div>
									</Card>

									<!-- 위험 구역 -->
									<Card class="border-l-4 border-l-red-500">
										<h4 class="mb-4 text-lg font-semibold text-red-600">위험 구역</h4>
										
										<div class="flex items-center justify-between">
											<div>
												<p class="font-medium text-gray-900">설정 초기화</p>
												<p class="text-sm text-gray-600">모든 설정을 기본값으로 되돌립니다</p>
											</div>
											<Button 
												variant="outline" 
												onclick={() => showResetModal = true}
												class="border-red-300 text-red-600 hover:bg-red-50"
											>
												초기화
											</Button>
										</div>
									</Card>
								</div>
							{/if}
						{/snippet}
					</Tabs>
				</Card>
			</div>
		</main>
	</div>

	<!-- 백업 생성 모달 -->
	{#if showBackupModal}
		<Modal
			title="백업 생성"
			open={showBackupModal}
			onClose={() => showBackupModal = false}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
						<div class="flex">
							<i class="fas fa-info-circle text-blue-400 mr-2 mt-0.5"></i>
							<div>
								<h4 class="text-sm font-medium text-blue-800">백업 정보</h4>
								<p class="text-sm text-blue-700 mt-1">
									모든 사용자 데이터, 설정, OAuth2 클라이언트 정보가 백업됩니다.
								</p>
							</div>
						</div>
					</div>

					<div>
						<p class="text-sm text-gray-600">
							백업을 생성하시겠습니까? 이 과정은 몇 분 정도 소요될 수 있습니다.
						</p>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={() => showBackupModal = false} disabled={isBackingUp}>
					취소
				</Button>
				<Button onclick={createBackup} disabled={isBackingUp}>
					{#if isBackingUp}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-download mr-2"></i>
					{/if}
					백업 생성
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- 백업 복원 모달 -->
	{#if showRestoreModal}
		<Modal
			title="백업 복원"
			open={showRestoreModal}
			onClose={() => showRestoreModal = false}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
						<div class="flex">
							<i class="fas fa-exclamation-triangle text-yellow-400 mr-2 mt-0.5"></i>
							<div>
								<h4 class="text-sm font-medium text-yellow-800">주의!</h4>
								<p class="text-sm text-yellow-700 mt-1">
									백업 복원 시 현재 데이터가 모두 덮어쓰여집니다. 이 작업은 되돌릴 수 없습니다.
								</p>
							</div>
						</div>
					</div>

					<div>
						<label for="backupFile" class="block text-sm font-medium text-gray-700 mb-2">
							백업 파일 선택
						</label>
						<input
							id="backupFile"
							type="file"
							accept=".backup,.json"
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
						/>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={() => showRestoreModal = false} disabled={isRestoring}>
					취소
				</Button>
				<Button onclick={restoreFromBackup} disabled={isRestoring} class="bg-red-600 hover:bg-red-700">
					{#if isRestoring}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-upload mr-2"></i>
					{/if}
					복원
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- 설정 초기화 모달 -->
	{#if showResetModal}
		<Modal
			title="설정 초기화"
			open={showResetModal}
			onClose={() => showResetModal = false}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="rounded-lg bg-red-50 border border-red-200 p-4">
						<div class="flex">
							<i class="fas fa-exclamation-triangle text-red-400 mr-2 mt-0.5"></i>
							<div>
								<h4 class="text-sm font-medium text-red-800">경고!</h4>
								<p class="text-sm text-red-700 mt-1">
									모든 설정이 기본값으로 초기화됩니다. 이 작업은 되돌릴 수 없습니다.
								</p>
							</div>
						</div>
					</div>

					<div>
						<p class="text-sm text-gray-600">
							정말로 모든 설정을 초기화하시겠습니까?
						</p>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={() => showResetModal = false}>
					취소
				</Button>
				<Button onclick={resetSettings} class="bg-red-600 hover:bg-red-700">
					<i class="fas fa-undo mr-2"></i>
					초기화
				</Button>
			{/snippet}
		</Modal>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<Card class="w-full max-w-md">
			<div class="text-center">
				<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인증 필요</h2>
				<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
				<Button onclick={() => (window.location.href = '/auth/login')}>
					로그인하기
				</Button>
			</div>
		</Card>
	</div>
{/if}