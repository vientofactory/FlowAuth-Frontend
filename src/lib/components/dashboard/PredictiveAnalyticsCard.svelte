<script lang="ts">
	import { Card } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBrain, faChartLine, faShieldAlt, faServer } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		advancedAnalytics: {
			predictiveInsights: {
				tokenDemand: { predicted: number; confidence: number };
				riskPrediction: { level: string; factors: string[] };
				systemCapacity: { current: number; bottleneck: string };
			};
		};
	}

	let { advancedAnalytics }: Props = $props();
</script>

{#if advancedAnalytics?.predictiveInsights?.tokenDemand?.predicted > 0}
	<Card class="border-l-4 border-l-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50">
		<div class="flex items-start space-x-4">
			<div class="shrink-0">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
					<FontAwesomeIcon icon={faBrain} class="text-xl text-indigo-600" />
				</div>
			</div>
			<div class="flex-1">
				<h3 class="mb-3 text-lg font-semibold text-gray-900">예측 분석</h3>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="flex items-center space-x-3 rounded-lg border border-indigo-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
							<FontAwesomeIcon icon={faChartLine} class="text-indigo-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">토큰 수요 예측</p>
							<p class="text-lg font-bold text-indigo-600">
								{(
									advancedAnalytics?.predictiveInsights?.tokenDemand?.predicted ?? 0
								).toLocaleString()}
							</p>
							<p class="text-xs text-gray-500">
								{(advancedAnalytics?.predictiveInsights?.tokenDemand?.confidence ?? 0).toFixed(0)}%
								신뢰도
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 rounded-lg border border-purple-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
							<FontAwesomeIcon icon={faShieldAlt} class="text-purple-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">리스크 레벨</p>
							<p class="text-lg font-bold text-purple-600">
								{advancedAnalytics?.predictiveInsights?.riskPrediction?.level ?? '알 수 없음'}
							</p>
							<p class="text-xs text-gray-500">
								{advancedAnalytics?.predictiveInsights?.riskPrediction?.factors?.length ?? 0}개 요인
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 rounded-lg border border-cyan-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100">
							<FontAwesomeIcon icon={faServer} class="text-cyan-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">시스템 용량</p>
							<p class="text-lg font-bold text-cyan-600">
								{(
									(advancedAnalytics?.predictiveInsights?.systemCapacity?.current ?? 0) * 100
								).toFixed(0)}%
							</p>
							<p class="text-xs text-gray-500">
								병목: {advancedAnalytics?.predictiveInsights?.systemCapacity?.bottleneck ?? '없음'}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Card>
{/if}
