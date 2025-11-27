<script lang="ts">
	import { Card } from '$lib';
	import type { User } from '$lib';
	import type { DashboardStats } from '$lib/types/dashboard';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faUsers, faClock, faCalendar, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		user: User | null;
		dashboardStats: Pick<DashboardStats, 'totalClients' | 'activeTokens' | 'lastLoginDate'>;
		isDeveloper: boolean;
		roleName: string;
	}

	let { user, dashboardStats, isDeveloper, roleName }: Props = $props();

	const stats = [
		{
			label: '클라이언트',
			value: dashboardStats.totalClients,
			icon: faUsers,
			color: 'from-stone-500 to-stone-600',
			show: isDeveloper
		},
		{
			label: '로그인',
			value: dashboardStats.lastLoginDate
				? dashboardStats.lastLoginDate.toLocaleDateString('ko-KR', {
						month: 'short',
						day: 'numeric'
					})
				: 'N/A',
			icon: faClock,
			color: 'from-gray-500 to-gray-600',
			show: true
		},
		{
			label: '계정 생성일',
			value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A',
			icon: faCalendar,
			color: 'from-slate-500 to-slate-600',
			show: true
		},
		{
			label: '권한',
			value: roleName,
			icon: faShieldAlt,
			color: 'from-zinc-500 to-zinc-600',
			show: true
		}
	].filter((stat) => stat.show);
</script>

<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Card class="bg-linear-to-br p-6 {stat.color} text-white">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium opacity-90">{stat.label}</p>
					<p class="mt-1 text-2xl font-bold">{stat.value}</p>
				</div>
				<FontAwesomeIcon icon={stat.icon} class="text-3xl opacity-80" />
			</div>
		</Card>
	{/each}
</div>

<style>
	/* Additional styles if needed */
</style>
