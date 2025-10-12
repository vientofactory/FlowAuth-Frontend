<script lang="ts">
	import { Card, Tabs } from '$lib';
	import Chart from '$lib/components/Chart.svelte';

	interface Props {
		dashboardStats: {
			tokenIssuanceByHour?: Array<{ hour: string; count: number }>;
			tokenIssuanceByDay?: Array<{ date: string; count: number }>;
			scopeUsageStats?: Array<{ scope: string; count: number }>;
			clientUsageStats?: Array<{ clientName: string; tokenCount: number }>;
		};
		selectedChart: string;
		onChartChange: (chart: string) => void;
	}

	let { dashboardStats, selectedChart, onChartChange }: Props = $props();

	let chartTabs = [
		{ id: 'hourly', label: '시간별 토큰 발급' },
		{ id: 'daily', label: '일별 토큰 발급' },
		{ id: 'clients', label: '클라이언트별 사용량' },
		{ id: 'scopes', label: '스코프별 사용량' }
	];

	function getChartConfig(chartType: string) {
		switch (chartType) {
			case 'hourly':
				return {
					type: 'line' as const,
					data: {
						labels:
							dashboardStats.tokenIssuanceByHour?.map((item: { hour: string }) => item.hour) || [],
						datasets: [
							{
								label: '토큰 발급 수',
								data:
									dashboardStats.tokenIssuanceByHour?.map(
										(item: { count: number }) => item.count
									) || [],
								borderColor: 'rgb(59, 130, 246)',
								backgroundColor: 'rgba(59, 130, 246, 0.1)',
								tension: 0.4
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							title: { display: true, text: '시간별 토큰 발급 현황' }
						},
						scales: {
							y: { beginAtZero: true }
						}
					}
				};
			case 'daily':
				return {
					type: 'bar' as const,
					data: {
						labels:
							dashboardStats.tokenIssuanceByDay?.map((item: { date: string }) => item.date) || [],
						datasets: [
							{
								label: '토큰 발급 수',
								data:
									dashboardStats.tokenIssuanceByDay?.map((item: { count: number }) => item.count) ||
									[],
								backgroundColor: 'rgba(34, 197, 94, 0.8)',
								borderColor: 'rgba(34, 197, 94, 1)',
								borderWidth: 1
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							title: { display: true, text: '일별 토큰 발급 현황' }
						},
						scales: {
							y: { beginAtZero: true }
						}
					}
				};
			case 'clients':
				return {
					type: 'doughnut' as const,
					data: {
						labels:
							dashboardStats.clientUsageStats?.map(
								(item: { clientName: string }) => item.clientName
							) || [],
						datasets: [
							{
								data:
									dashboardStats.clientUsageStats?.map(
										(item: { tokenCount: number }) => item.tokenCount
									) || [],
								backgroundColor: [
									'rgba(239, 68, 68, 0.8)',
									'rgba(245, 158, 11, 0.8)',
									'rgba(34, 197, 94, 0.8)',
									'rgba(59, 130, 246, 0.8)',
									'rgba(147, 51, 234, 0.8)',
									'rgba(236, 72, 153, 0.8)'
								],
								borderWidth: 2
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							title: { display: true, text: '클라이언트별 토큰 사용량' },
							legend: { position: 'bottom' as const }
						}
					}
				};
			case 'scopes':
				return {
					type: 'bar' as const,
					data: {
						labels:
							dashboardStats.scopeUsageStats?.map((item: { scope: string }) => item.scope) || [],
						datasets: [
							{
								label: '사용 횟수',
								data:
									dashboardStats.scopeUsageStats?.map((item: { count: number }) => item.count) ||
									[],
								backgroundColor: 'rgba(147, 51, 234, 0.8)',
								borderColor: 'rgba(147, 51, 234, 1)',
								borderWidth: 1
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							title: { display: true, text: '스코프별 사용 현황' }
						},
						scales: {
							y: { beginAtZero: true }
						}
					}
				};
			default:
				return null;
		}
	}

	let currentChartConfig = $derived(getChartConfig(selectedChart));
</script>

<Card>
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900">토큰 분석</h3>
	</div>

	<Tabs tabs={chartTabs} activeTab={selectedChart} onTabChange={onChartChange} />

	<div class="mt-6">
		{#if currentChartConfig}
			<Chart
				type={currentChartConfig.type}
				data={currentChartConfig.data}
				options={currentChartConfig.options}
			/>
		{:else}
			<div class="py-8 text-center text-gray-500">차트를 표시할 수 없습니다.</div>
		{/if}
	</div>
</Card>
