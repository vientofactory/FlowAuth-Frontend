<script lang="ts">
	import SecurityMetricsCard from './SecurityMetricsCard.svelte';
	import InsightsCard from './InsightsCard.svelte';
	import AnalyticsCharts from './AnalyticsCharts.svelte';
	import PredictiveAnalyticsCard from './PredictiveAnalyticsCard.svelte';
	import StatsSummaryCards from './StatsSummaryCards.svelte';
	import { DashboardSkeleton } from '$lib';
	import type {
		SecurityMetrics,
		TokenAnalytics,
		DashboardStats,
		AdvancedAnalytics
	} from '$lib/types/dashboard';

	interface Props {
		isLoading: boolean;
		securityMetrics: SecurityMetrics;
		tokenAnalytics: TokenAnalytics;
		dashboardStats: DashboardStats;
		advancedAnalytics: AdvancedAnalytics;
	}

	let { isLoading, securityMetrics, tokenAnalytics, dashboardStats, advancedAnalytics }: Props =
		$props();
</script>

<div class="space-y-6">
	<!-- 로딩 상태 -->
	{#if isLoading}
		<div class="space-y-6">
			<DashboardSkeleton type="insights" />
			<div class="grid gap-6 lg:grid-cols-2">
				<DashboardSkeleton type="chart" />
				<DashboardSkeleton type="chart" />
				<DashboardSkeleton type="chart" />
				<DashboardSkeleton type="chart" />
			</div>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _, i (i)}
					<div
						class="overflow-hidden rounded-xl border-gray-200 bg-gradient-to-br from-gray-200 to-gray-300 p-4 text-center shadow-lg"
					>
						<div class="mb-3 flex items-center justify-center">
							<div class="h-8 w-8 animate-pulse rounded bg-white/40"></div>
						</div>
						<div class="mx-auto mb-1 h-8 w-16 animate-pulse rounded bg-white/40"></div>
						<div class="mx-auto mb-1 h-4 w-20 animate-pulse rounded bg-white/40"></div>
						<div class="mx-auto h-3 w-12 animate-pulse rounded bg-white/40"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- 보안 메트릭 카드 -->
		<SecurityMetricsCard {securityMetrics} />

		<!-- 인사이트 카드 -->
		<InsightsCard {dashboardStats} />

		<!-- 메인 차트 그리드 -->
		<AnalyticsCharts {dashboardStats} {tokenAnalytics} {securityMetrics} />

		<!-- 예측 분석 카드 -->
		<PredictiveAnalyticsCard {advancedAnalytics} />

		<!-- 통계 요약 카드들 -->
		<StatsSummaryCards {dashboardStats} />
	{/if}
</div>
