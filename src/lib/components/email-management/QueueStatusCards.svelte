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
			color: 'from-blue-500 to-blue-600',
			textColor: 'text-blue-100',
			icon: 'fas fa-cog'
		},
		{
			label: '대기 중',
			value: queueStats.waiting,
			color: 'from-yellow-500 to-yellow-600',
			textColor: 'text-yellow-100',
			icon: 'fas fa-clock'
		},
		{
			label: '완료됨',
			value: queueStats.completed,
			color: 'from-green-500 to-green-600',
			textColor: 'text-green-100',
			icon: 'fas fa-check'
		},
		{
			label: '실패함',
			value: queueStats.failed,
			color: 'from-red-500 to-red-600',
			textColor: 'text-red-100',
			icon: 'fas fa-times'
		},
		{
			label: '지연됨',
			value: queueStats.delayed,
			color: 'from-purple-500 to-purple-600',
			textColor: 'text-purple-100',
			icon: 'fas fa-pause'
		},
		{
			label: '큐 상태',
			value: queueStats.paused > 0 ? '일시정지' : '실행 중',
			color: queueStats.paused > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
			textColor: queueStats.paused > 0 ? 'text-red-100' : 'text-green-100',
			icon: queueStats.paused > 0 ? 'fas fa-pause' : 'fas fa-play'
		}
	]);
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each statusCards as card (card.label)}
		<div
			class="rounded-lg bg-linear-to-r {card.color} relative overflow-hidden p-4 text-white {hasOptimisticUpdates
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
					<p class={card.textColor}>
						{card.label}
						{#if hasOptimisticUpdates}
							<span class="text-xs opacity-75">(업데이트 중)</span>
						{/if}
					</p>
					<p class="text-2xl font-bold">{card.value}</p>
				</div>
				<i class="{card.icon} fa-2x {card.textColor.replace('100', '200')}"></i>
			</div>
		</div>
	{/each}
</div>
