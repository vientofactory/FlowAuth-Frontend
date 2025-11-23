<script lang="ts">
	import { Card } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faLightbulb,
		faChartLine,
		faCheckCircle,
		faExclamationTriangle,
		faInfoCircle
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		dashboardStats: {
			insights: {
				trends: string;
				recommendations: string;
				alerts: string;
			};
		};
	}

	let { dashboardStats }: Props = $props();
</script>

<Card class="border-l-4 border-l-stone-400 bg-gradient-to-r from-stone-50 to-gray-50">
	<div class="flex items-start space-x-4">
		<div class="flex-shrink-0">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
				<FontAwesomeIcon icon={faLightbulb} class="text-xl text-stone-600" />
			</div>
		</div>
		<div class="flex-1">
			<h3 class="mb-3 text-lg font-semibold text-gray-900">인사이트 분석</h3>
			<div class="grid gap-4 md:grid-cols-3">
				{#if dashboardStats.insights.trends}
					<div class="flex items-start space-x-3 rounded-lg border border-stone-200 bg-white p-3">
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-100"
						>
							<FontAwesomeIcon icon={faChartLine} class="text-stone-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">트렌드 분석</p>
							<p class="mt-1 text-sm text-gray-600">{dashboardStats.insights.trends}</p>
						</div>
					</div>
				{/if}
				{#if dashboardStats.insights.recommendations}
					<div class="flex items-start space-x-3 rounded-lg border border-neutral-200 bg-white p-3">
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100"
						>
							<FontAwesomeIcon icon={faCheckCircle} class="text-neutral-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">권장사항</p>
							<p class="mt-1 text-sm text-gray-600">
								{dashboardStats.insights.recommendations}
							</p>
						</div>
					</div>
				{/if}
				{#if dashboardStats.insights.alerts}
					<div class="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-3">
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100"
						>
							<FontAwesomeIcon icon={faExclamationTriangle} class="text-gray-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">주의사항</p>
							<p class="mt-1 text-sm text-gray-600">{dashboardStats.insights.alerts}</p>
						</div>
					</div>
				{/if}
			</div>
			{#if !dashboardStats.insights.trends && !dashboardStats.insights.recommendations && !dashboardStats.insights.alerts}
				<div class="py-8 text-center text-gray-500">
					<FontAwesomeIcon icon={faInfoCircle} class="mb-2 text-3xl" />
					<p>분석할 데이터가 충분하지 않습니다.</p>
					<p class="mt-1 text-sm">더 많은 활동 후 다시 확인해주세요.</p>
				</div>
			{/if}
		</div>
	</div>
</Card>
