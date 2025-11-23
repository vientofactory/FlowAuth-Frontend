<script lang="ts">
	import { Card } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faShieldAlt,
		faExclamationTriangle,
		faExclamationCircle,
		faInfoCircle,
		faInfo,
		faCheckCircle
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		securityMetrics: {
			alerts: {
				total: number;
				critical: number;
				high: number;
				medium: number;
				low: number;
			};
			riskAnalysis: {
				recommendations: string[];
			};
		};
	}

	let { securityMetrics }: Props = $props();
</script>

{#if securityMetrics?.alerts?.total > 0}
	<Card class="border-l-4 border-l-red-400 bg-gradient-to-r from-red-50 to-orange-50">
		<div class="flex items-start space-x-4">
			<div class="shrink-0">
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<FontAwesomeIcon icon={faShieldAlt} class="text-xl text-red-600" />
				</div>
			</div>
			<div class="flex-1">
				<h3 class="mb-3 text-lg font-semibold text-gray-900">보안 알림</h3>
				<div class="grid gap-4 md:grid-cols-4">
					<div class="flex items-center space-x-3 rounded-lg border border-red-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
							<FontAwesomeIcon icon={faExclamationTriangle} class="text-red-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">심각</p>
							<p class="text-lg font-bold text-red-600">{securityMetrics?.alerts?.critical ?? 0}</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 rounded-lg border border-orange-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
							<FontAwesomeIcon icon={faExclamationCircle} class="text-orange-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">높음</p>
							<p class="text-lg font-bold text-orange-600">{securityMetrics?.alerts?.high ?? 0}</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 rounded-lg border border-yellow-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
							<FontAwesomeIcon icon={faInfoCircle} class="text-yellow-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">중간</p>
							<p class="text-lg font-bold text-yellow-600">
								{securityMetrics?.alerts?.medium ?? 0}
							</p>
						</div>
					</div>
					<div class="flex items-center space-x-3 rounded-lg border border-blue-200 bg-white p-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<FontAwesomeIcon icon={faInfo} class="text-blue-600" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900">낮음</p>
							<p class="text-lg font-bold text-blue-600">{securityMetrics?.alerts?.low ?? 0}</p>
						</div>
					</div>
				</div>
				{#if securityMetrics?.riskAnalysis?.recommendations?.length > 0}
					<div class="mt-4 rounded-lg bg-white p-4">
						<h4 class="mb-2 font-medium text-gray-900">보안 권장사항</h4>
						<ul class="space-y-1 text-sm text-gray-600">
							{#each securityMetrics?.riskAnalysis?.recommendations ?? [] as recommendation, index (index)}
								<li class="flex items-start space-x-2">
									<FontAwesomeIcon icon={faCheckCircle} class="mt-0.5 text-green-500" />
									<span>{recommendation}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</Card>
{/if}
