<script lang="ts">
	import { Card, Badge } from '$lib';
	import type { TokenInfo } from '$lib/utils/jwt-utils';

	interface Props {
		tokenInfo: TokenInfo | null;
	}

	let { tokenInfo }: Props = $props();

	// 사용자 정보 추출
	let userInfo = $derived(
		tokenInfo?.payload
			? {
					sub: tokenInfo.payload.sub as string,
					name: tokenInfo.payload.name as string,
					email: tokenInfo.payload.email as string,
					email_verified: tokenInfo.payload.email_verified as boolean,
					picture: tokenInfo.payload.picture as string,
					locale: tokenInfo.payload.locale as string,
					updated_at: tokenInfo.payload.updated_at as number,
					iss: tokenInfo.payload.iss as string,
					aud: tokenInfo.payload.aud as string | string[],
					exp: tokenInfo.payload.exp as number,
					iat: tokenInfo.payload.iat as number,
					auth_time: tokenInfo.payload.auth_time as number,
					nonce: tokenInfo.payload.nonce as string,
					acr: tokenInfo.payload.acr as string,
					amr: tokenInfo.payload.amr as string[],
					azp: tokenInfo.payload.azp as string
				}
			: null
	);

	function formatTimestamp(timestamp?: number): string {
		if (!timestamp) return 'N/A';
		return new Date(timestamp * 1000).toLocaleString();
	}

	function formatArray(value?: string[] | string): string {
		if (!value) return 'N/A';
		if (Array.isArray(value)) {
			return value.join(', ');
		}
		return value;
	}
</script>

{#if userInfo}
	<Card>
		<div class="p-6">
			<div class="mb-4 flex items-center">
				{#if userInfo.picture}
					<img
						src={userInfo.picture}
						alt="프로필 사진"
						class="mr-4 h-12 w-12 rounded-full border-2 border-gray-200"
					/>
				{:else}
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
						<i class="fas fa-user text-gray-600"></i>
					</div>
				{/if}
				<div>
					<h3 class="text-lg font-semibold text-gray-900">
						{userInfo.name || '이름 없음'}
					</h3>
					{#if userInfo.email}
						<p class="flex items-center text-sm text-gray-600">
							<i class="fas fa-envelope mr-1"></i>
							{userInfo.email}
							{#if userInfo.email_verified}
								<Badge variant="success" class="ml-2 text-xs">인증됨</Badge>
							{/if}
						</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="space-y-3">
					<div>
						<span class="block text-sm font-medium text-gray-700">사용자 ID</span>
						<p class="rounded bg-gray-50 p-2 font-mono text-sm text-gray-900">
							{userInfo.sub || 'N/A'}
						</p>
					</div>

					{#if userInfo.locale}
						<div>
							<span class="block text-sm font-medium text-gray-700">언어</span>
							<p class="text-sm text-gray-900">{userInfo.locale}</p>
						</div>
					{/if}

					{#if userInfo.updated_at}
						<div>
							<span class="block text-sm font-medium text-gray-700">마지막 업데이트</span>
							<p class="text-sm text-gray-900">{formatTimestamp(userInfo.updated_at)}</p>
						</div>
					{/if}
				</div>

				<div class="space-y-3">
					<div>
						<span class="block text-sm font-medium text-gray-700">발급자</span>
						<p class="rounded bg-gray-50 p-2 font-mono text-sm break-all text-gray-900">
							{userInfo.iss || 'N/A'}
						</p>
					</div>

					<div>
						<span class="block text-sm font-medium text-gray-700">대상</span>
						<p class="rounded bg-gray-50 p-2 font-mono text-sm break-all text-gray-900">
							{formatArray(userInfo.aud)}
						</p>
					</div>

					{#if userInfo.azp}
						<div>
							<span class="block text-sm font-medium text-gray-700">승인된 파티</span>
							<p class="rounded bg-gray-50 p-2 font-mono text-sm break-all text-gray-900">
								{userInfo.azp}
							</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="mt-4 border-t border-gray-200 pt-4">
				<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
					<div>
						<span class="block font-medium text-gray-700">발급 시간</span>
						<p class="text-gray-900">{formatTimestamp(userInfo.iat)}</p>
					</div>

					<div>
						<span class="block font-medium text-gray-700">만료 시간</span>
						<p class="text-gray-900">{formatTimestamp(userInfo.exp)}</p>
					</div>

					{#if userInfo.auth_time}
						<div>
							<span class="block font-medium text-gray-700">인증 시간</span>
							<p class="text-gray-900">{formatTimestamp(userInfo.auth_time)}</p>
						</div>
					{/if}
				</div>
			</div>

			{#if userInfo.acr || userInfo.amr || userInfo.nonce}
				<div class="mt-4 border-t border-gray-200 pt-4">
					<h4 class="mb-2 font-medium text-gray-900">보안 정보</h4>
					<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
						{#if userInfo.acr}
							<div>
								<span class="block font-medium text-gray-700">인증 맥락 클래스</span>
								<p class="text-gray-900">{userInfo.acr}</p>
							</div>
						{/if}

						{#if userInfo.amr}
							<div>
								<span class="block font-medium text-gray-700">인증 방법</span>
								<p class="text-gray-900">{formatArray(userInfo.amr)}</p>
							</div>
						{/if}

						{#if userInfo.nonce}
							<div>
								<span class="block font-medium text-gray-700">Nonce</span>
								<p class="rounded bg-gray-50 p-1 font-mono text-xs break-all text-gray-900">
									{userInfo.nonce}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</Card>
{/if}
