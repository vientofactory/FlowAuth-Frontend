<script lang="ts">
	import { apiClient } from '$lib';
	import { onMount } from 'svelte';

	interface EmailSystemStatus {
		queueStats: {
			active: number;
			waiting: number;
			completed: number;
			failed: number;
			delayed: number;
			paused: number;
		};
		smtpConnected: boolean;
		lastChecked: Date;
	}

	let emailStatus = $state<EmailSystemStatus | null>(null);
	let isLoading = $state(true);
	let hasError = $state(false);

	onMount(async () => {
		try {
			const [queueStats, smtpStatus] = await Promise.all([
				apiClient.getEmailQueueStats(),
				apiClient.testSMTPConnection()
			]);

			emailStatus = {
				queueStats,
				smtpConnected: smtpStatus.success,
				lastChecked: new Date()
			};
		} catch (error) {
			console.error('Failed to load email system status:', error);
			hasError = true;
		} finally {
			isLoading = false;
		}
	});

	// 상태별 색상 클래스
	const getStatusColor = (isHealthy: boolean) => {
		return isHealthy ? 'text-green-600' : 'text-red-600';
	};

	const getStatusBgColor = (isHealthy: boolean) => {
		return isHealthy ? 'bg-green-100' : 'bg-red-100';
	};

	// 큐 건강도 계산
	const isQueueHealthy = $derived(() => {
		if (!emailStatus) return false;
		const { failed, paused } = emailStatus.queueStats;
		return failed < 5 && !paused; // 실패한 작업이 5개 미만이고 일시정지되지 않은 경우 건강
	});

	// 전체 시스템 건강도
	const isSystemHealthy = $derived(() => {
		return (emailStatus?.smtpConnected && isQueueHealthy()) || false;
	});
</script>

{#if isLoading}
	<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
		<div class="flex items-center space-x-3">
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
			></div>
			<span class="text-sm text-gray-600">이메일 시스템 상태 확인 중...</span>
		</div>
	</div>
{:else if hasError}
	<div class="rounded-lg border border-red-200 bg-red-50 p-4">
		<div class="flex items-center space-x-3">
			<i class="fas fa-exclamation-triangle text-red-500"></i>
			<span class="text-sm text-red-700">이메일 시스템 상태를 불러올 수 없습니다.</span>
		</div>
	</div>
{:else if emailStatus}
	<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-3">
				<div class="rounded-full p-2 {getStatusBgColor(isSystemHealthy())}">
					<i class="fas fa-envelope text-sm {getStatusColor(isSystemHealthy())}"></i>
				</div>
				<div>
					<h4 class="text-sm font-medium text-gray-900">이메일 시스템</h4>
					<p class="text-xs text-gray-600">
						SMTP: {emailStatus.smtpConnected ? '연결됨' : '연결 실패'} · 큐: {emailStatus.queueStats
							.paused
							? '일시정지'
							: '실행 중'}
					</p>
				</div>
			</div>

			<div class="flex items-center space-x-4 text-xs text-gray-500">
				<div class="text-center">
					<div class="font-medium text-gray-900">{emailStatus.queueStats.waiting}</div>
					<div>대기</div>
				</div>
				<div class="text-center">
					<div class="font-medium text-gray-900">{emailStatus.queueStats.active}</div>
					<div>처리중</div>
				</div>
				{#if emailStatus.queueStats.failed > 0}
					<div class="text-center">
						<div class="font-medium text-red-600">{emailStatus.queueStats.failed}</div>
						<div class="text-red-600">실패</div>
					</div>
				{/if}
			</div>
		</div>

		{#if !isSystemHealthy()}
			<div class="mt-3 rounded bg-yellow-50 p-2">
				<p class="text-xs text-yellow-800">
					<i class="fas fa-exclamation-triangle mr-1"></i>
					시스템 관리자에게 문의하거나
					<a href="/dashboard/email-management" class="font-medium underline hover:no-underline">
						이메일 관리
					</a>에서 확인하세요.
				</p>
			</div>
		{/if}
	</div>
{/if}
