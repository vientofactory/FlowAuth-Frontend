<script lang="ts">
	import { Card } from '$lib';
	import Alert from '$lib/components/Alert.svelte';

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
		<Alert variant="error" title="인증 에러" message={error} />
	{:else if responseType === 'code id_token'}
		<Alert
			variant="success"
			title="하이브리드 인증 성공 (Hybrid Grant)"
			message="인증 코드와 ID 토큰을 모두 받았습니다."
		/>
	{:else if authCode}
		<Alert
			variant="success"
			title="인증 성공 (Authorization Code Grant)"
			message="인증 코드를 성공적으로 받았습니다."
		/>
	{:else if implicitTokens}
		<Alert
			variant="success"
			title="토큰 수신 성공 (Implicit Grant)"
			message="{responseType} 방식으로 토큰을 성공적으로 받았습니다."
		/>
	{:else}
		<Alert
			variant="info"
			title="정보"
			message="인증 결과가 없습니다. OAuth2 테스터에서 인증을 시작하세요."
		/>
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
