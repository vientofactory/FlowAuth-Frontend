<script lang="ts">
	import { Card, Button } from '$lib';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';

	interface Props {
		user: User | null;
		dashboardStats: {
			totalClients: number;
			activeTokens: number;
			lastLoginDate: string | null;
		};
		isDeveloper: boolean;
		roleName: string;
		navigateToClients: () => void;
	}

	let { user, dashboardStats, isDeveloper, roleName, navigateToClients }: Props = $props();
</script>

<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each [{ label: '클라이언트', value: dashboardStats.totalClients, icon: 'fas fa-users', color: 'from-blue-500 to-blue-600', show: isDeveloper }, { label: '토큰', value: dashboardStats.activeTokens, icon: 'fas fa-key', color: 'from-green-500 to-green-600', show: true }, { label: '로그인', value: dashboardStats.lastLoginDate ? new Date(dashboardStats.lastLoginDate).toLocaleDateString( 'ko-KR', { month: 'short', day: 'numeric' } ) : 'N/A', icon: 'fas fa-clock', color: 'from-purple-500 to-purple-600', show: true }, { label: '계정', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A', icon: 'fas fa-calendar', color: 'from-orange-500 to-orange-600', show: true }, { label: '권한', value: roleName, icon: 'fas fa-shield-alt', color: 'from-red-500 to-red-600', show: true }].filter((stat) => stat.show) as stat (stat.label)}
		<Card class="bg-gradient-to-br p-6 {stat.color} text-white">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium opacity-90">{stat.label}</p>
					<p class="mt-1 text-2xl font-bold">{stat.value}</p>
				</div>
				<i class="{stat.icon} text-3xl opacity-80"></i>
			</div>
		</Card>
	{/each}
</div>

{#if isDeveloper}
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each [{ label: '클라이언트\n생성', icon: 'fas fa-plus-circle', color: 'blue', action: navigateToClients }, { label: '토큰\n관리', icon: 'fas fa-key', color: 'green', action: () => goto('/tokens') }, { label: '설정', icon: 'fas fa-cog', color: 'gray', action: () => goto('/settings') }, { label: '문서', icon: 'fas fa-book', color: 'purple', action: () => window.open('/docs', '_blank') }] as action (action.label)}
			<Button
				variant="outline"
				class="flex h-20 flex-col items-center justify-center gap-2 hover:bg-{action.color}-50"
				onclick={action.action}
			>
				<i class="{action.icon} text-xl"></i>
				<span class="text-center text-sm whitespace-pre-line">{action.label}</span>
			</Button>
		{/each}
	</div>
{/if}

<style>
	/* Additional styles if needed */
</style>
