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
		queueStats: Pick<EmailQueueStats, 'active' | 'waiting' | 'completed' | 'failed' | 'delayed'>;
		pendingOperations?: string[];
	}

	let { queueStats, pendingOperations = [] }: Props = $props();

	// 낙관적 업데이트 진행 중인지 확인
	const hasOptimisticUpdates = $derived(pendingOperations.length > 0);

	// 큐 상태 색상 계산
	const getQueueStatusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'text-green-600';
			case 'waiting':
				return 'text-blue-600';
			case 'failed':
				return 'text-red-600';
			case 'paused':
				return 'text-yellow-600';
			case 'delayed':
				return 'text-purple-600';
			case 'completed':
				return 'text-green-600';
			default:
				return 'text-gray-600';
		}
	};

	const queueRows = $derived([
		{
			status: 'active' as const,
			label: '처리 중',
			count: queueStats.active,
			icon: 'fas fa-cog',
			description: '현재 처리되고 있는 이메일 작업'
		},
		{
			status: 'waiting' as const,
			label: '대기 중',
			count: queueStats.waiting,
			icon: 'fas fa-clock',
			description: '처리 대기 중인 이메일 작업'
		},
		{
			status: 'completed' as const,
			label: '완료됨',
			count: queueStats.completed,
			icon: 'fas fa-check',
			description: '성공적으로 전송된 이메일',
			colorOverride: 'text-green-600'
		},
		{
			status: 'failed' as const,
			label: '실패함',
			count: queueStats.failed,
			icon: 'fas fa-times',
			description: '전송 실패한 이메일 작업'
		},
		{
			status: 'delayed' as const,
			label: '지연됨',
			count: queueStats.delayed,
			icon: 'fas fa-pause',
			description: '지연된 이메일 작업 (예약 전송)',
			colorOverride: 'text-purple-600'
		}
	]);
</script>

<div class="overflow-hidden rounded-lg bg-white shadow">
	<table class="min-w-full divide-y divide-gray-200">
		<thead class="bg-gray-50">
			<tr>
				<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
					상태
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
					작업 수
				</th>
				<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
					설명
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white">
			{#each queueRows as row (row.status)}
				<tr class={hasOptimisticUpdates ? 'bg-yellow-50 transition-colors duration-300' : ''}>
					<td class="px-6 py-4 whitespace-nowrap">
						<span
							class="flex items-center gap-2 font-medium {row.colorOverride ||
								getQueueStatusColor(row.status)}"
						>
							<i class="{row.icon} {hasOptimisticUpdates ? 'animate-pulse' : ''}"></i>
							{row.label}
							{#if hasOptimisticUpdates}
								<span class="text-xs text-orange-600">(업데이트 중)</span>
							{/if}
						</span>
					</td>
					<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
						<span class={hasOptimisticUpdates ? 'font-bold text-blue-600' : ''}>{row.count}</span>
					</td>
					<td class="px-6 py-4 text-sm text-gray-500">{row.description}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
