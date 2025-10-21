<script lang="ts">
	import { Card } from '$lib';
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
	}

	let { user, dashboardStats, isDeveloper, roleName }: Props = $props();
</script>

<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each [{ label: '클라이언트', value: dashboardStats.totalClients, icon: 'fas fa-users', color: 'from-stone-500 to-stone-600', show: isDeveloper }, { label: '토큰', value: dashboardStats.activeTokens, icon: 'fas fa-key', color: 'from-neutral-500 to-neutral-600', show: true }, { label: '로그인', value: dashboardStats.lastLoginDate ? new Date(dashboardStats.lastLoginDate).toLocaleDateString( 'ko-KR', { month: 'short', day: 'numeric' } ) : 'N/A', icon: 'fas fa-clock', color: 'from-gray-500 to-gray-600', show: true }, { label: '계정', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A', icon: 'fas fa-calendar', color: 'from-slate-500 to-slate-600', show: true }, { label: '권한', value: roleName, icon: 'fas fa-shield-alt', color: 'from-zinc-500 to-zinc-600', show: true }].filter((stat) => stat.show) as stat (stat.label)}
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

<style>
	/* Additional styles if needed */
</style>
