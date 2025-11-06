<script lang="ts">
	interface EmailQueueStats {
		active: number;
		waiting: number;
		completed: number;
		failed: number;
		delayed: number;
		paused: number;
	}

	interface Props {
		queueStats: Pick<EmailQueueStats, 'failed' | 'paused'>;
		isProcessing: boolean;
		pendingOperations?: string[];
		showAdvanced?: boolean;
		onRetryFailed: () => void;
		onCleanQueue: () => void;
		onPauseQueue: () => void;
		onResumeQueue: () => void;
		onPurgeQueue?: () => void;
	}

	let {
		queueStats,
		isProcessing,
		pendingOperations = [],
		showAdvanced = false,
		onRetryFailed,
		onCleanQueue,
		onPauseQueue,
		onResumeQueue,
		onPurgeQueue
	}: Props = $props();

	// 각 작업의 진행 상태 확인 함수
	function isOperationPending(operationId: string): boolean {
		return pendingOperations.includes(operationId);
	}

	// 버튼 스타일 생성 함수 (낙관적 업데이트 시각적 피드백)
	function getButtonStyle(baseStyle: string, operationId?: string): string {
		if (operationId && isOperationPending(operationId)) {
			return baseStyle + ' animate-pulse opacity-75';
		}
		return baseStyle;
	}
</script>

<div>
	<h4 class="mb-4 text-lg font-medium text-gray-900">빠른 작업</h4>
	<div class="flex flex-wrap gap-3">
		<button
			onclick={onRetryFailed}
			disabled={isProcessing || queueStats.failed === 0}
			class={getButtonStyle(
				'flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50',
				'retryFailed'
			)}
		>
			{#if isOperationPending('retryFailed')}
				<i class="fas fa-spinner fa-spin"></i>
				재시도 중...
			{:else}
				<i class="fas fa-redo"></i>
				실패한 작업 재시도 ({queueStats.failed})
			{/if}
		</button>

		<button
			onclick={onCleanQueue}
			disabled={isProcessing}
			class={getButtonStyle(
				'flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50',
				'cleanQueue'
			)}
		>
			{#if isOperationPending('cleanQueue')}
				<i class="fas fa-spinner fa-spin"></i>
				정리 중...
			{:else}
				<i class="fas fa-broom"></i>
				큐 정리
			{/if}
		</button>

		{#if queueStats.paused > 0}
			<button
				onclick={onResumeQueue}
				disabled={isProcessing}
				class={getButtonStyle(
					'flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50',
					'resumeQueue'
				)}
			>
				{#if isOperationPending('resumeQueue')}
					<i class="fas fa-spinner fa-spin"></i>
					재개 중...
				{:else}
					<i class="fas fa-play"></i>
					큐 재개
				{/if}
			</button>
		{:else}
			<button
				onclick={onPauseQueue}
				disabled={isProcessing}
				class={getButtonStyle(
					'flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700 disabled:opacity-50',
					'pauseQueue'
				)}
			>
				{#if isOperationPending('pauseQueue')}
					<i class="fas fa-spinner fa-spin"></i>
					일시정지 중...
				{:else}
					<i class="fas fa-pause"></i>
					큐 일시정지
				{/if}
			</button>
		{/if}

		{#if showAdvanced && onPurgeQueue}
			<button
				onclick={onPurgeQueue}
				disabled={isProcessing}
				class={getButtonStyle(
					'flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50',
					'purgeQueue'
				)}
			>
				{#if isOperationPending('purgeQueue')}
					<i class="fas fa-spinner fa-spin"></i>
					비우는 중...
				{:else}
					<i class="fas fa-trash"></i>
					큐 완전 비우기
				{/if}
			</button>
		{/if}
	</div>
</div>
