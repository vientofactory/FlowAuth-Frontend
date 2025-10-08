<script lang="ts">
	import { Card } from '$lib';
	import type { User } from '$lib';

	interface _StatItem {
		label: string;
		value: string;
		icon: string;
		color: string;
		show: boolean;
	}

	interface Props {
		user: User | null;
		dashboardStats: {
			totalClients?: number;
			activeTokens?: number;
			totalTokensIssued?: number;
			lastLoginDate?: string;
		};
		roleName: string;
	}

	let { user, dashboardStats, roleName }: Props = $props();

	let stats = $derived(
		[
			{
				label: '클라이언트 수',
				value: (dashboardStats.totalClients ?? 0).toString(),
				icon: 'fas fa-puzzle-piece',
				color: 'from-blue-500 to-blue-600',
				show: true
			},
			{
				label: '활성 토큰',
				value: (dashboardStats.activeTokens ?? 0).toString(),
				icon: 'fas fa-key',
				color: 'from-green-500 to-green-600',
				show: true
			},
			{
				label: '총 발급 토큰',
				value: (dashboardStats.totalTokensIssued ?? 0).toString(),
				icon: 'fas fa-chart-line',
				color: 'from-purple-500 to-purple-600',
				show: true
			},
			{
				label: '마지막 로그인',
				value: dashboardStats.lastLoginDate
					? new Date(dashboardStats.lastLoginDate).toLocaleDateString('ko-KR')
					: '오늘',
				icon: 'fas fa-clock',
				color: 'from-indigo-500 to-indigo-600',
				show: true
			},
			{
				label: '계정',
				value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A',
				icon: 'fas fa-calendar',
				color: 'from-orange-500 to-orange-600',
				show: true
			},
			{
				label: '권한',
				value: roleName,
				icon: 'fas fa-shield-alt',
				color: 'from-red-500 to-red-600',
				show: true
			}
		].filter((stat) => stat.show)
	);
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Card>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class={`flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-r ${stat.color}`}
					>
						<i class="{stat.icon} text-2xl text-white"></i>
					</div>
				</div>
				<div class="ml-4">
					<dt class="text-sm font-medium text-gray-500">{stat.label}</dt>
					<dd class="text-2xl font-bold text-gray-900">{stat.value}</dd>
				</div>
			</div>
		</Card>
	{/each}
</div>
