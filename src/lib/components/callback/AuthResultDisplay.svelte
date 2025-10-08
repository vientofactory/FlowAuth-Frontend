<script lang="ts">
	import { Card } from '$lib';

	interface Props {
		error: string;
		authCode: string;
		implicitTokens: { access_token?: string; id_token?: string; refresh_token?: string } | null;
		responseType: string;
		oauthState: string;
	}

	let { error, authCode, implicitTokens, responseType, oauthState }: Props = $props();
</script>

<Card class="p-6">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">인증 결과</h3>

	{#if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex items-center">
				<i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>
				<span class="font-medium text-red-800">인증 에러</span>
			</div>
			<p class="mt-1 text-red-700">{error}</p>
		</div>
	{:else if authCode}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="flex items-center">
				<i class="fas fa-check-circle mr-2 text-green-600"></i>
				<span class="font-medium text-green-800">인증 성공 (Authorization Code Grant)</span>
			</div>
			<p class="mt-1 text-green-700">인증 코드를 성공적으로 받았습니다.</p>
		</div>
	{:else if implicitTokens}
		<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="flex items-center">
				<i class="fas fa-check-circle mr-2 text-green-600"></i>
				<span class="font-medium text-green-800">토큰 수신 성공 (Implicit Grant)</span>
			</div>
			<p class="mt-1 text-green-700">
				{responseType} 방식으로 토큰을 성공적으로 받았습니다.
			</p>
		</div>
	{:else}
		<div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
			<div class="flex items-center">
				<i class="fas fa-info-circle mr-2 text-yellow-600"></i>
				<span class="font-medium text-yellow-800">정보</span>
			</div>
			<p class="mt-1 text-yellow-700">인증 결과가 없습니다. OAuth2 테스터에서 인증을 시작하세요.</p>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#if responseType}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">Response Type</div>
				<div class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all">
					{responseType}
				</div>
			</div>
		{/if}

		{#if authCode}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">인증 코드</div>
				<div class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all">
					{authCode}
				</div>
			</div>
		{/if}

		{#if implicitTokens?.access_token}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">Access Token (일부)</div>
				<div class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all">
					{implicitTokens.access_token.substring(0, 50)}...
				</div>
			</div>
		{/if}

		{#if implicitTokens?.id_token}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">ID Token (일부)</div>
				<div class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all">
					{implicitTokens.id_token.substring(0, 50)}...
				</div>
			</div>
		{/if}

		{#if oauthState}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">State</div>
				<div class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all">
					{oauthState}
				</div>
			</div>
		{/if}
	</div>
</Card>
