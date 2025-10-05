<script lang="ts">
	import { Card } from '$lib';
	import { formatJWTPayload, formatJWTHeader, type TokenInfo } from '$lib/utils/jwt-utils';

	interface Props {
		activeTab: string;
		decodedAccessToken: TokenInfo | null;
		decodedIdToken: TokenInfo | null;
		decodedRefreshToken: TokenInfo | null;
		tokenResponse: {
			access_token: string;
			token_type: string;
			expires_in: number;
			refresh_token?: string;
			scope?: string;
			id_token?: string;
		} | null;
	}

	let { activeTab, decodedAccessToken, decodedIdToken, decodedRefreshToken, tokenResponse }: Props =
		$props();
</script>

{#if activeTab === 'access' && decodedAccessToken && tokenResponse}
	<div class="space-y-4">
		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">액세스 토큰 헤더</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTHeader(
						decodedAccessToken.header
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">액세스 토큰 페이로드</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTPayload(
						decodedAccessToken.payload
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">액세스 토큰 서명</h3>
				<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
					{decodedAccessToken.signature}
				</div>
			</div>
		</Card>
	</div>
{:else if activeTab === 'id' && decodedIdToken && tokenResponse}
	<div class="space-y-4">
		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">ID 토큰 헤더</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTHeader(
						decodedIdToken.header
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">ID 토큰 페이로드</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTPayload(
						decodedIdToken.payload
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">ID 토큰 서명</h3>
				<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
					{decodedIdToken.signature}
				</div>
			</div>
		</Card>
	</div>
{:else if activeTab === 'refresh' && decodedRefreshToken && tokenResponse}
	<div class="space-y-4">
		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">리프레시 토큰 헤더</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTHeader(
						decodedRefreshToken.header
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">리프레시 토큰 페이로드</h3>
				<pre
					class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">{formatJWTPayload(
						decodedRefreshToken.payload
					)}</pre>
			</div>
		</Card>

		<Card>
			<div class="p-4">
				<h3 class="mb-3 font-medium text-gray-900">리프레시 토큰 서명</h3>
				<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
					{decodedRefreshToken.signature}
				</div>
			</div>
		</Card>
	</div>
{/if}
