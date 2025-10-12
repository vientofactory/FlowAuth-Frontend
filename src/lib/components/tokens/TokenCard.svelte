<script lang="ts">
	import { Card, Button, Badge } from '$lib';
	import { TOKEN_TYPES } from '$lib/types/authorization.types';

	interface TokenCardData {
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
		// 추가 프로퍼티들
		isRevoked?: boolean;
		lastUsedAt?: string;
	}

	interface Props {
		token: TokenCardData;
		isCurrentSession: boolean;
		onRevoke: (token: TokenCardData) => void;
	}

	let { token, isCurrentSession, onRevoke }: Props = $props();

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function getTokenStatus(token: TokenCardData) {
		const now = new Date();
		const expiresAt = new Date(token.expiresAt);

		if (now > expiresAt) {
			return { text: '만료됨', variant: 'error' as const };
		} else if (token.isRevoked) {
			return { text: '폐기됨', variant: 'secondary' as const };
		} else {
			return { text: '활성', variant: 'success' as const };
		}
	}

	function getTimeUntilExpiration(expiresAt: string) {
		const now = new Date();
		const expiry = new Date(expiresAt);
		const diff = expiry.getTime() - now.getTime();

		if (diff <= 0) return '만료됨';

		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}일 후 만료`;
		if (hours > 0) return `${hours}시간 후 만료`;
		return `${minutes}분 후 만료`;
	}

	let status = $derived(getTokenStatus(token));
	let timeRemaining = $derived(getTimeUntilExpiration(token.expiresAt));
	let scopesArray = $derived(
		Array.isArray(token.scopes) ? token.scopes : token.scopes ? [token.scopes] : []
	);
	let clientName = $derived(token.client?.name);
</script>

<Card>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<div class="mb-2 flex items-center gap-2">
				<h3 class="text-lg font-semibold text-gray-900">
					{#if token.tokenType === TOKEN_TYPES.LOGIN}
						<i class="fas fa-sign-in-alt mr-2 text-blue-500"></i>
						로그인 토큰
					{:else}
						<i class="fas fa-key mr-2 text-green-500"></i>
						OAuth2 토큰
					{/if}
				</h3>

				<Badge variant={status.variant}>{status.text}</Badge>

				{#if isCurrentSession}
					<Badge variant="info">현재 세션</Badge>
				{/if}
			</div>

			{#if clientName}
				<p class="mb-2 text-sm text-gray-600">
					<i class="fas fa-puzzle-piece mr-1"></i>
					클라이언트: {clientName}
				</p>
			{/if}

			{#if scopesArray.length > 0}
				<div class="mb-3">
					<p class="mb-1 text-sm text-gray-600">
						<i class="fas fa-list mr-1"></i>
						스코프:
					</p>
					<div class="flex flex-wrap gap-1">
						{#each scopesArray as scope (scope)}
							<Badge variant="info" size="sm">{scope}</Badge>
						{/each}
					</div>
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
				<div>
					<i class="fas fa-calendar-plus mr-1"></i>
					발급: {formatDate(token.createdAt)}
				</div>
				<div>
					<i class="fas fa-calendar-times mr-1"></i>
					만료: {formatDate(token.expiresAt)}
				</div>
				<div class="sm:col-span-2">
					<i class="fas fa-clock mr-1"></i>
					{timeRemaining}
				</div>
			</div>

			{#if token.lastUsedAt}
				<p class="mt-2 text-sm text-gray-600">
					<i class="fas fa-history mr-1"></i>
					마지막 사용: {formatDate(token.lastUsedAt)}
				</p>
			{/if}
		</div>

		<div class="ml-4">
			{#if !token.isRevoked && new Date() < new Date(token.expiresAt)}
				<Button
					variant="outline"
					size="sm"
					onclick={() => onRevoke(token)}
					class="border-red-300 text-red-600 hover:bg-red-50"
					disabled={isCurrentSession}
				>
					<i class="fas fa-trash mr-1"></i>
					폐기
				</Button>

				{#if isCurrentSession}
					<p class="mt-1 text-center text-xs text-gray-500">현재 세션은 폐기할 수 없습니다</p>
				{/if}
			{/if}
		</div>
	</div>
</Card>
