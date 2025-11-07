<script lang="ts">
	import { Card } from '$lib';

	interface EmailQueueStats {
		active: number;
		waiting: number;
		completed: number;
		failed: number;
		delayed: number;
		paused: number;
	}

	interface Props {
		queueStats: EmailQueueStats;
		pendingOperations?: string[];
	}

	let { queueStats, pendingOperations = [] }: Props = $props();

	// 낙관적 업데이트 진행 중인지 확인
	const hasOptimisticUpdates = $derived(pendingOperations.length > 0);

	const statusCards = $derived([
		{
			label: '처리 중',
			value: queueStats.active,
			color: 'from-stone-500 to-stone-600',
			icon: 'fas fa-cog',
			bgColor: 'bg-stone-100',
			iconColor: 'text-stone-600'
		},
		{
			label: '대기 중',
			value: queueStats.waiting,
			color: 'from-neutral-500 to-neutral-600',
			icon: 'fas fa-clock',
			bgColor: 'bg-neutral-100',
			iconColor: 'text-neutral-600'
		},
		{
			label: '완료됨',
			value: queueStats.completed,
			color: 'from-gray-500 to-gray-600',
			icon: 'fas fa-check',
			bgColor: 'bg-gray-100',
			iconColor: 'text-gray-600'
		},
		{
			label: '실패함',
			value: queueStats.failed,
			color: 'from-slate-500 to-slate-600',
			icon: 'fas fa-times',
			bgColor: 'bg-slate-100',
			iconColor: 'text-slate-600'
		},
		{
			label: '지연됨',
			value: queueStats.delayed,
			color: 'from-zinc-500 to-zinc-600',
			icon: 'fas fa-pause',
			bgColor: 'bg-zinc-100',
			iconColor: 'text-zinc-600'
		},
		{
			label: '큐 상태',
			value: queueStats.paused > 0 ? '일시정지' : '실행 중',
			color: queueStats.paused > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
			icon: queueStats.paused > 0 ? 'fas fa-pause' : 'fas fa-play',
			bgColor: queueStats.paused > 0 ? 'bg-red-100' : 'bg-green-100',
			iconColor: queueStats.paused > 0 ? 'text-red-600' : 'text-green-600'
		}
	]);
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each statusCards as card (card.label)}
		<Card
			class="bg-linear-to-br p-6 {card.color} relative overflow-hidden text-white {hasOptimisticUpdates
				? 'transition-all duration-300'
				: ''}"
		>
			<!-- 낙관적 업데이트 진행 표시 -->
			{#if hasOptimisticUpdates}
				<div
					class="absolute inset-0 animate-pulse bg-linear-to-r from-transparent via-white/20 to-transparent"
				></div>
			{/if}

			<div class="relative z-10 flex items-center justify-between">
				<div>
					<p class="text-sm font-medium opacity-90">
						{card.label}
						{#if hasOptimisticUpdates}
							<span class="text-xs opacity-75">(업데이트 중)</span>
						{/if}
					</p>
					<p class="mt-1 text-2xl font-bold">{card.value}</p>
				</div>
				<i class="{card.icon} text-3xl opacity-80"></i>
			</div>
		</Card>
	{/each}
</div>
