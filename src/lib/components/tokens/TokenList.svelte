<script lang="ts">
	import TokenCard from './TokenCard.svelte';

	interface TokenData {
		id: number;
		accessToken: string;
		refreshToken?: string;
		tokenType: string;
		expiresAt: string;
		refreshExpiresAt?: string;
		scopes?: string | string[];
		userId: number;
		clientId?: number;
		client?: {
			name: string;
			clientId: string;
		};
		createdAt: string;
		updatedAt: string;
		isRevoked?: boolean;
		lastUsedAt?: string;
	}

	interface Props {
		tokens: TokenData[];
		currentSessionTokenId?: number;
		loading?: boolean;
		onRevoke: (token: TokenData) => void;
	}

	let { tokens, currentSessionTokenId, loading = false, onRevoke }: Props = $props();

	let filteredTokens = $derived(
		tokens.filter((token) => !token.isRevoked || new Date(token.expiresAt) > new Date())
	);
	let expiredTokens = $derived(
		tokens.filter((token) => token.isRevoked || new Date(token.expiresAt) <= new Date())
	);
	let activeTokens = $derived(
		filteredTokens.filter((token) => !token.isRevoked && new Date(token.expiresAt) > new Date())
	);
</script>

{#if loading}
	<div class="space-y-4">
		{#each Array(3) as _, index (index)}
			<div class="animate-pulse">
				<div class="rounded-lg border bg-white p-6 shadow-sm">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center gap-2">
								<div class="h-6 w-32 rounded bg-gray-200"></div>
								<div class="h-5 w-12 rounded bg-gray-200"></div>
							</div>
							<div class="space-y-3">
								<div class="h-4 w-48 rounded bg-gray-200"></div>
								<div class="grid grid-cols-2 gap-3">
									<div class="h-4 w-full rounded bg-gray-200"></div>
									<div class="h-4 w-full rounded bg-gray-200"></div>
								</div>
							</div>
						</div>
						<div class="ml-4">
							<div class="h-8 w-16 rounded bg-gray-200"></div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if tokens.length === 0}
	<div class="rounded-lg border bg-white py-12 text-center shadow-sm">
		<i class="fas fa-key mb-4 text-4xl text-gray-400"></i>
		<h3 class="mb-2 text-lg font-medium text-gray-900">토큰이 없습니다</h3>
		<p class="text-gray-500">
			현재 발급된 토큰이 없습니다. 로그인하거나 OAuth2 앱을 통해 토큰이 생성됩니다.
		</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- 활성 토큰들 -->
		{#if activeTokens.length > 0}
			<div>
				<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
					<i class="fas fa-check-circle mr-2 text-neutral-500"></i>
					활성 토큰 ({activeTokens.length}개)
				</h3>
				<div class="space-y-4">
					{#each activeTokens as token (token.id)}
						<TokenCard {token} isCurrentSession={token.id === currentSessionTokenId} {onRevoke} />
					{/each}
				</div>
			</div>
		{/if}

		<!-- 만료/폐기된 토큰들 -->
		{#if expiredTokens.length > 0}
			<div>
				<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
					<i class="fas fa-exclamation-circle mr-2 text-red-500"></i>
					만료/폐기된 토큰 ({expiredTokens.length}개)
				</h3>
				<div class="space-y-4">
					{#each expiredTokens as token (token.id)}
						<div class="opacity-60">
							<TokenCard {token} isCurrentSession={false} {onRevoke} />
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
