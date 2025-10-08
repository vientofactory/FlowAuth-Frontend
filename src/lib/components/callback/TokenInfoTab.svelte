<script lang="ts">
	import { Button, Loading } from '$lib';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface Props {
		tokenResponse: TokenResponse | null;
		implicitTokens: TokenResponse | null;
		isTestingToken: boolean;
		onCopyToClipboard: (text: string) => void;
		onFetchUserProfile: () => void;
		onAnalyzeToken: () => void;
		onAnalyzeIdToken: () => void;
		formatJwtToken: (token: string) => {
			isValid: boolean;
			header: string;
			payload: string;
			signature: string;
			fullToken: string;
		};
	}

	let {
		tokenResponse,
		implicitTokens,
		isTestingToken,
		onCopyToClipboard,
		onFetchUserProfile,
		onAnalyzeToken,
		onAnalyzeIdToken,
		formatJwtToken
	}: Props = $props();

	let accessToken = $derived(tokenResponse?.access_token || implicitTokens?.access_token);
	let idToken = $derived(tokenResponse?.id_token || implicitTokens?.id_token);
</script>

<div class="space-y-4">
	{#if accessToken}
		{@const accessTokenParts = formatJwtToken(accessToken)}
		<div>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Access Token (JWT)</span>
				<Button
					variant="outline"
					size="sm"
					onclick={() => onCopyToClipboard(accessToken)}
					class="text-xs"
				>
					<i class="fas fa-copy mr-1"></i>
					복사
				</Button>
			</div>
			{#if accessTokenParts.isValid}
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<div class="mb-2 text-xs font-medium text-gray-600">JWT 구조:</div>
					<code class="text-xs break-all">
						<span class="font-semibold text-red-600" title="Header">{accessTokenParts.header}</span
						><span class="text-gray-400">.</span><span
							class="font-semibold text-blue-600"
							title="Payload">{accessTokenParts.payload}</span
						><span class="text-gray-400">.</span><span
							class="font-semibold text-green-600"
							title="Signature">{accessTokenParts.signature}</span
						>
					</code>
					<div class="mt-2 grid grid-cols-3 gap-2 text-xs">
						<div class="text-red-600"><i class="fas fa-circle mr-1"></i>Header</div>
						<div class="text-blue-600"><i class="fas fa-circle mr-1"></i>Payload</div>
						<div class="text-green-600"><i class="fas fa-circle mr-1"></i>Signature</div>
					</div>
				</div>
			{:else}
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<code class="text-xs break-all text-gray-800">{accessToken}</code>
				</div>
			{/if}
		</div>
	{/if}

	{#if tokenResponse?.refresh_token}
		<div>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Refresh Token</span>
				<Button
					variant="outline"
					size="sm"
					onclick={() =>
						tokenResponse?.refresh_token && onCopyToClipboard(tokenResponse.refresh_token)}
					class="text-xs"
				>
					<i class="fas fa-copy mr-1"></i>
					복사
				</Button>
			</div>
			<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
				<code class="text-xs break-all text-gray-800">{tokenResponse.refresh_token}</code>
			</div>
		</div>
	{/if}

	{#if idToken}
		{@const idTokenParts = formatJwtToken(idToken)}
		<div>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">ID Token (JWT)</span>
				<Button
					variant="outline"
					size="sm"
					onclick={() => onCopyToClipboard(idToken)}
					class="text-xs"
				>
					<i class="fas fa-copy mr-1"></i>
					복사
				</Button>
			</div>
			{#if idTokenParts.isValid}
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<div class="mb-2 text-xs font-medium text-gray-600">JWT 구조:</div>
					<code class="text-xs break-all">
						<span class="font-semibold text-red-600" title="Header">{idTokenParts.header}</span
						><span class="text-gray-400">.</span><span
							class="font-semibold text-blue-600"
							title="Payload">{idTokenParts.payload}</span
						><span class="text-gray-400">.</span><span
							class="font-semibold text-green-600"
							title="Signature">{idTokenParts.signature}</span
						>
					</code>
					<div class="mt-2 grid grid-cols-3 gap-2 text-xs">
						<div class="text-red-600"><i class="fas fa-circle mr-1"></i>Header</div>
						<div class="text-blue-600"><i class="fas fa-circle mr-1"></i>Payload</div>
						<div class="text-green-600"><i class="fas fa-circle mr-1"></i>Signature</div>
					</div>
				</div>
			{:else}
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<code class="text-xs break-all text-gray-800">{idToken}</code>
				</div>
			{/if}
		</div>
	{/if}

	{#if tokenResponse}
		<div class="grid grid-cols-2 gap-4">
			{#if tokenResponse.token_type}
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">Token Type</div>
					<div class="text-sm text-gray-900">{tokenResponse.token_type}</div>
				</div>
			{/if}

			{#if tokenResponse.expires_in}
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">Expires In</div>
					<div class="text-sm text-gray-900">{tokenResponse.expires_in}초</div>
				</div>
			{/if}

			{#if tokenResponse.scope}
				<div class="col-span-2">
					<div class="mb-1 text-sm font-medium text-gray-700">Scope</div>
					<div class="text-sm text-gray-900">{tokenResponse.scope}</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- 액션 버튼들 -->
	<div class="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
		<Button onclick={onFetchUserProfile} disabled={isTestingToken} size="sm">
			{#if isTestingToken}
				<Loading variant="spinner" size="sm" class="mr-2" />
				프로필 가져오는 중...
			{:else}
				<i class="fas fa-user mr-2"></i>
				프로필 가져오기
			{/if}
		</Button>
		<Button variant="outline" onclick={onAnalyzeToken} size="sm">
			<i class="fas fa-search mr-2"></i>
			액세스 토큰 분석
		</Button>
		{#if tokenResponse?.id_token}
			<Button variant="outline" onclick={onAnalyzeIdToken} size="sm">
				<i class="fas fa-id-card mr-2"></i>
				ID 토큰 분석
			</Button>
		{/if}
	</div>
</div>
