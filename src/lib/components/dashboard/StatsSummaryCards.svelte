<script lang="ts">
	import { Card } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faKey, faClock, faBan, faPercentage } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		dashboardStats: {
			totalTokensIssued: number;
			expiredTokens: number;
			revokedTokens: number;
			tokenExpirationRate: number;
		};
	}

	let { dashboardStats }: Props = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card
		class="border-stone-200 bg-linear-to-br from-stone-50 to-stone-100 text-center transition-shadow hover:shadow-md"
	>
		<div class="p-4">
			<div class="mb-3 flex items-center justify-center">
				<FontAwesomeIcon icon={faKey} class="text-3xl text-stone-600" />
			</div>
			<p class="mb-1 text-3xl font-bold text-stone-900">
				{dashboardStats.totalTokensIssued.toLocaleString()}
			</p>
			<p class="text-sm font-medium text-stone-700">총 토큰 발급</p>
			<p class="mt-1 text-xs text-stone-600">누적 발급량</p>
		</div>
	</Card>

	<Card
		class="border-neutral-200 bg-linear-to-br from-neutral-50 to-neutral-100 text-center transition-shadow hover:shadow-md"
	>
		<div class="p-4">
			<div class="mb-3 flex items-center justify-center">
				<FontAwesomeIcon icon={faClock} class="text-3xl text-neutral-600" />
			</div>
			<p class="mb-1 text-3xl font-bold text-neutral-900">
				{dashboardStats.expiredTokens.toLocaleString()}
			</p>
			<p class="text-sm font-medium text-neutral-700">만료된 토큰</p>
			<p class="mt-1 text-xs text-neutral-600">
				{dashboardStats.tokenExpirationRate.toFixed(1)}% 만료율
			</p>
		</div>
	</Card>

	<Card
		class="border-gray-200 bg-linear-to-br from-gray-50 to-gray-100 text-center transition-shadow hover:shadow-md"
	>
		<div class="p-4">
			<div class="mb-3 flex items-center justify-center">
				<FontAwesomeIcon icon={faBan} class="text-3xl text-gray-600" />
			</div>
			<p class="mb-1 text-3xl font-bold text-gray-900">
				{dashboardStats.revokedTokens.toLocaleString()}
			</p>
			<p class="text-sm font-medium text-gray-700">취소된 토큰</p>
			<p class="mt-1 text-xs text-gray-600">보안 조치</p>
		</div>
	</Card>

	<Card
		class="border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 text-center transition-shadow hover:shadow-md"
	>
		<div class="p-4">
			<div class="mb-3 flex items-center justify-center">
				<FontAwesomeIcon icon={faPercentage} class="text-3xl text-slate-600" />
			</div>
			<p class="mb-1 text-3xl font-bold text-slate-900">
				{dashboardStats.tokenExpirationRate.toFixed(1)}%
			</p>
			<p class="text-sm font-medium text-slate-700">만료율</p>
			<p class="mt-1 text-xs text-slate-600">전체 대비</p>
		</div>
	</Card>
</div>
