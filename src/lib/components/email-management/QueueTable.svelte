<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCog,
		faClock,
		faCheck,
		faTimes,
		faPause,
		faList
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
		queueStats: Pick<EmailQueueStats, 'active' | 'waiting' | 'completed' | 'failed' | 'delayed'>;
		pendingOperations?: string[];
	}

	let { queueStats, pendingOperations = [] }: Props = $props();

	// 낙관적 업데이트 진행 중인지 확인
	const hasOptimisticUpdates = $derived(pendingOperations.length > 0);

	const queueRows = $derived([
		{
			status: 'active' as const,
			label: '처리 중',
			count: queueStats.active,
			icon: faCog,
			description: '현재 처리되고 있는 이메일 작업',
			bgColor: 'bg-stone-100',
			iconColor: 'text-stone-600',
			textColor: 'text-stone-700'
		},
		{
			status: 'waiting' as const,
			label: '대기 중',
			count: queueStats.waiting,
			icon: faClock,
			description: '처리 대기 중인 이메일 작업',
			bgColor: 'bg-neutral-100',
			iconColor: 'text-neutral-600',
			textColor: 'text-neutral-700'
		},
		{
			status: 'completed' as const,
			label: '완료됨',
			count: queueStats.completed,
			icon: faCheck,
			description: '성공적으로 전송된 이메일',
			bgColor: 'bg-gray-100',
			iconColor: 'text-gray-600',
			textColor: 'text-gray-700'
		},
		{
			status: 'failed' as const,
			label: '실패함',
			count: queueStats.failed,
			icon: faTimes,
			description: '전송 실패한 이메일 작업',
			bgColor: 'bg-slate-100',
			iconColor: 'text-slate-600',
			textColor: 'text-slate-700'
		},
		{
			status: 'delayed' as const,
			label: '지연됨',
			count: queueStats.delayed,
			icon: faPause,
			description: '지연된 이메일 작업 (예약 전송)',
			bgColor: 'bg-zinc-100',
			iconColor: 'text-zinc-600',
			textColor: 'text-zinc-700'
		}
	]);
</script>

<div
	class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 shadow-sm ring-1 ring-stone-100"
>
	<div class="relative">
		<div class="border-b border-gray-200 px-6 py-4">
			<h4 class="flex items-center text-lg font-semibold text-gray-900">
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faList} class="text-stone-600" />
				</div>
				큐 상세 현황
			</h4>
			<p class="mt-1 text-sm text-gray-600">각 큐 상태별 작업 수와 설명을 확인하세요</p>
		</div>

		<div class="p-6">
			<div class="grid gap-4">
				{#each queueRows as row (row.status)}
					<div
						class="flex items-center space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 {hasOptimisticUpdates
							? 'animate-pulse'
							: 'hover:bg-white/80'}"
					>
						<div class="flex h-12 w-12 items-center justify-center rounded-lg {row.bgColor}">
							<FontAwesomeIcon icon={row.icon} class="text-xl {row.iconColor}" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<h5 class="font-medium {row.textColor}">
									{row.label}
									{#if hasOptimisticUpdates}
										<span class="text-xs text-orange-600">(업데이트 중)</span>
									{/if}
								</h5>
								<span
									class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
								>
									{row.count}개
								</span>
							</div>
							<p class="text-sm text-gray-500">{row.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
