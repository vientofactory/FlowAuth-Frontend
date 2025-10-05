<script lang="ts">
	import { Modal, Button, Badge, Card } from '$lib';
	import { decodeJWT, type TokenInfo } from '$lib/utils/jwt-utils';
	import TokenDetails from './TokenDetails.svelte';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface Props {
		open: boolean;
		tokenResponse: TokenResponse | null;
		oauthNonce?: string;
		onClose: () => void;
	}

	let { open, tokenResponse, oauthNonce, onClose }: Props = $props();

	let activeTab = $state('overview');
	let decodedAccessToken = $state<TokenInfo | null>(null);
	let decodedIdToken = $state<TokenInfo | null>(null);
	let decodedRefreshToken = $state<TokenInfo | null>(null);

	// 토큰 디코딩
	$effect(() => {
		if (tokenResponse?.access_token) {
			const result = decodeJWT(tokenResponse.access_token);
			decodedAccessToken = result?.tokenInfo || null;
		}

		if (tokenResponse?.id_token) {
			const result = decodeJWT(tokenResponse.id_token, oauthNonce);
			decodedIdToken = result?.tokenInfo || null;
		}

		if (tokenResponse?.refresh_token) {
			const result = decodeJWT(tokenResponse.refresh_token);
			decodedRefreshToken = result?.tokenInfo || null;
		}
	});

	// 클립보드에 복사
	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			// TODO: 토스트 메시지 표시
		} catch {
			// TODO: 에러 처리
		}
	}

	function formatScope(scope?: string): string[] {
		return scope ? scope.split(' ') : [];
	}
</script>

<Modal {open} {onClose} size="xl">
	<div class="p-6">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="flex items-center text-xl font-semibold text-gray-900">
				<i class="fas fa-key mr-2 text-green-600"></i>
				토큰 정보
			</h2>
			<Button variant="secondary" size="sm" onclick={onClose}>
				<i class="fas fa-times"></i>
			</Button>
		</div>

		{#if tokenResponse}
			<!-- 탭 네비게이션 -->
			<div class="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
				<button
					class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
					'overview'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'}"
					onclick={() => (activeTab = 'overview')}
				>
					개요
				</button>
				{#if decodedAccessToken}
					<button
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
						'access'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
						onclick={() => (activeTab = 'access')}
					>
						액세스 토큰
					</button>
				{/if}
				{#if decodedIdToken}
					<button
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
						'id'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
						onclick={() => (activeTab = 'id')}
					>
						ID 토큰
					</button>
				{/if}
				{#if decodedRefreshToken}
					<button
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors {activeTab ===
						'refresh'
							? 'bg-white text-gray-900 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'}"
						onclick={() => (activeTab = 'refresh')}
					>
						리프레시 토큰
					</button>
				{/if}
			</div>

			<!-- 탭 콘텐츠 -->
			{#if activeTab === 'overview'}
				<div class="space-y-4">
					<Card>
						<div class="p-4">
							<h3 class="mb-3 font-medium text-gray-900">토큰 개요</h3>
							<div class="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span class="text-gray-600">토큰 타입:</span>
									<span class="ml-2 font-medium">{tokenResponse.token_type}</span>
								</div>
								<div>
									<span class="text-gray-600">만료 시간:</span>
									<span class="ml-2 font-medium">{tokenResponse.expires_in}초</span>
								</div>
								{#if tokenResponse.scope}
									<div class="col-span-2">
										<span class="text-gray-600">권한 범위:</span>
										<div class="mt-1 flex flex-wrap gap-1">
											{#each formatScope(tokenResponse.scope) as scope (scope)}
												<Badge variant="secondary" class="text-xs">{scope}</Badge>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</Card>

					{#if tokenResponse.access_token}
						<Card>
							<div class="p-4">
								<div class="mb-2 flex items-center justify-between">
									<h4 class="font-medium text-gray-900">액세스 토큰</h4>
									<Button
										variant="secondary"
										size="sm"
										onclick={() => copyToClipboard(tokenResponse.access_token!)}
									>
										<i class="fas fa-copy mr-1"></i>
										복사
									</Button>
								</div>
								<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
									{tokenResponse.access_token}
								</div>
							</div>
						</Card>
					{/if}

					{#if tokenResponse.refresh_token}
						<Card>
							<div class="p-4">
								<div class="mb-2 flex items-center justify-between">
									<h4 class="font-medium text-gray-900">리프레시 토큰</h4>
									<Button
										variant="secondary"
										size="sm"
										onclick={() => copyToClipboard(tokenResponse.refresh_token!)}
									>
										<i class="fas fa-copy mr-1"></i>
										복사
									</Button>
								</div>
								<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
									{tokenResponse.refresh_token}
								</div>
							</div>
						</Card>
					{/if}

					{#if tokenResponse.id_token}
						<Card>
							<div class="p-4">
								<div class="mb-2 flex items-center justify-between">
									<h4 class="font-medium text-gray-900">ID 토큰</h4>
									<Button
										variant="secondary"
										size="sm"
										onclick={() => copyToClipboard(tokenResponse.id_token!)}
									>
										<i class="fas fa-copy mr-1"></i>
										복사
									</Button>
								</div>
								<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
									{tokenResponse.id_token}
								</div>
							</div>
						</Card>
					{/if}
				</div>
			{:else if activeTab === 'access' && decodedAccessToken}
				<TokenDetails
					title="액세스 토큰"
					tokenInfo={decodedAccessToken}
					tokenString={tokenResponse.access_token}
				/>
			{:else if activeTab === 'id' && decodedIdToken}
				<TokenDetails
					title="ID 토큰"
					tokenInfo={decodedIdToken}
					tokenString={tokenResponse.id_token!}
				/>
			{:else if activeTab === 'refresh' && decodedRefreshToken}
				<TokenDetails
					title="리프레시 토큰"
					tokenInfo={decodedRefreshToken}
					tokenString={tokenResponse.refresh_token!}
				/>
			{/if}
		{/if}
	</div>
</Modal>

<!-- 토큰 상세 정보 컴포넌트 -->
<TokenDetails
	{activeTab}
	{decodedAccessToken}
	{decodedIdToken}
	{decodedRefreshToken}
	{tokenResponse}
/>
