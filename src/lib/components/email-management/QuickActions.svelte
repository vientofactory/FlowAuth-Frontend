<script lang="ts">
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faRedo,
		faBroom,
		faPlay,
		faPause,
		faTrash,
		faBolt,
		faSpinner
	} from '@fortawesome/free-solid-svg-icons';

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

	// 액션 버튼 구성
	const actions = $derived.by(() => {
		const baseActions = [
			{
				id: 'retryFailed',
				label: `실패한 작업 재시도 (${queueStats.failed})`,
				loadingLabel: '재시도 중...',
				icon: faRedo,
				color: 'stone',
				disabled: queueStats.failed === 0,
				action: onRetryFailed
			},
			{
				id: 'cleanQueue',
				label: '큐 정리',
				loadingLabel: '정리 중...',
				icon: faBroom,
				color: 'neutral',
				disabled: false,
				action: onCleanQueue
			}
		];

		if (queueStats.paused > 0) {
			baseActions.push({
				id: 'resumeQueue',
				label: '큐 재개',
				loadingLabel: '재개 중...',
				icon: faPlay,
				color: 'gray',
				disabled: false,
				action: onResumeQueue
			});
		} else {
			baseActions.push({
				id: 'pauseQueue',
				label: '큐 일시정지',
				loadingLabel: '일시정지 중...',
				icon: faPause,
				color: 'slate',
				disabled: false,
				action: onPauseQueue
			});
		}

		if (showAdvanced && onPurgeQueue) {
			baseActions.push({
				id: 'purgeQueue',
				label: '큐 완전 비우기',
				loadingLabel: '비우는 중...',
				icon: faTrash,
				color: 'zinc',
				disabled: false,
				action: onPurgeQueue
			});
		}

		return baseActions;
	});

	// 색상 설정 상수
	const COLOR_CLASSES = {
		stone: {
			hover: 'hover:border-stone-400 hover:bg-stone-50',
			background: 'bg-stone-100 group-hover:bg-stone-200',
			text: 'text-stone-600'
		},
		neutral: {
			hover: 'hover:border-neutral-400 hover:bg-neutral-50',
			background: 'bg-neutral-100 group-hover:bg-neutral-200',
			text: 'text-neutral-600'
		},
		gray: {
			hover: 'hover:border-gray-400 hover:bg-gray-50',
			background: 'bg-gray-100 group-hover:bg-gray-200',
			text: 'text-gray-600'
		},
		slate: {
			hover: 'hover:border-slate-400 hover:bg-slate-50',
			background: 'bg-slate-100 group-hover:bg-slate-200',
			text: 'text-slate-600'
		},
		zinc: {
			hover: 'hover:border-zinc-400 hover:bg-zinc-50',
			background: 'bg-zinc-100 group-hover:bg-zinc-200',
			text: 'text-zinc-600'
		}
	} as const;

	// 그리드 컬럼 수 계산 함수
	function getGridColsClass(count: number): string {
		switch (count) {
			case 1:
				return 'grid-cols-1';
			case 2:
				return 'grid-cols-1 sm:grid-cols-2';
			case 3:
				return 'grid-cols-2 sm:grid-cols-3';
			default:
				return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
		}
	}
</script>

<div
	class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
>
	<div class="relative">
		<div class="mb-6 text-center sm:text-left">
			<h3
				class="mb-2 flex items-center justify-center text-lg font-semibold text-gray-900 sm:justify-start"
			>
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faBolt} class="text-stone-600" />
				</div>
				빠른 작업
			</h3>
			<p class="text-sm text-gray-600">이메일 큐 관리 작업을 빠르게 실행하세요</p>
		</div>
		<div class="grid gap-4 {getGridColsClass(actions.length)}">
			{#each actions as action (action.id)}
				{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
				{@const isPending = isOperationPending(action.id)}
				<div
					class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 {isPending
						? 'animate-pulse opacity-75'
						: 'hover:scale-105 hover:bg-white/80 hover:shadow-lg'}"
				>
					<Button
						variant="ghost"
						class="flex h-full w-full flex-col items-center justify-center space-y-3 p-0 hover:bg-transparent"
						onclick={action.action}
						disabled={isProcessing || action.disabled}
					>
						<div class="relative">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 {colorClass?.background ||
									'bg-gray-100'} {isPending ? '' : 'group-hover:scale-110 group-hover:shadow-lg'}"
							>
								{#if isPending}
									<FontAwesomeIcon
										icon={faSpinner}
										class="text-xl {colorClass?.text || 'text-gray-600'} animate-spin"
									/>
								{:else}
									<FontAwesomeIcon
										icon={action.icon}
										class="text-xl {colorClass?.text || 'text-gray-600'}"
									/>
								{/if}
							</div>
							{#if !isPending}
								<div
									class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-linear-to-br from-stone-400 to-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
								></div>
							{/if}
						</div>
						<span
							class="text-center text-sm leading-tight font-medium text-gray-700 transition-colors group-hover:text-gray-900"
						>
							{isPending ? action.loadingLabel : action.label}
						</span>
					</Button>
				</div>
			{/each}
		</div>
	</div>
</div>
