<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient, Tabs, Modal } from '$lib';
	import { useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { Token } from '$lib/types/oauth.types';
	import { authState, authStore } from '$lib';
	import type { User } from '$lib';
	import { TOKEN_TYPES, type TokenType } from '$lib/types/authorization.types';

	let _user = $state<User | null>(null);
	let tokens = $state<Token[]>([]);
	let isLoading = $state(true);
	let unsubscribe: (() => void) | null = null;
	let activeTab = $state<TokenType>(TOKEN_TYPES.LOGIN);

	// 현재 세션 토큰 ID
	let currentSessionTokenId = $state<string | null>(null);

	let showRevokeModal = $state(false);
	let showRevokeAllModal = $state(false);
	let selectedToken = $state<Token | null>(null);
	let selectedTokenType = $state<TokenType | null>(null);
	let isRevoking = $state(false);

	const toast = useToast();

	// 토큰 타입별 필터링
	let loginTokens = $derived(tokens.filter((token) => token.tokenType === TOKEN_TYPES.LOGIN));
	let oauth2Tokens = $derived(tokens.filter((token) => token.tokenType === TOKEN_TYPES.OAUTH2));
	let currentTokens = $derived(activeTab === TOKEN_TYPES.LOGIN ? loginTokens : oauth2Tokens);

	function handleTabChange(tabId: string) {
		activeTab = tabId as TokenType;
	}

	// 모달 관련 함수들
	function openRevokeModal(token: Token) {
		selectedToken = token;
		showRevokeModal = true;
	}

	function openRevokeAllModal(tokenType: TokenType) {
		selectedTokenType = tokenType;
		showRevokeAllModal = true;
	}

	function closeRevokeModal() {
		showRevokeModal = false;
		selectedToken = null;
	}

	function closeRevokeAllModal() {
		showRevokeAllModal = false;
		selectedTokenType = null;
	}

	// 현재 세션 토큰인지 확인
	function isCurrentSessionToken(token: Token): boolean {
		return currentSessionTokenId !== null && token.id.toString() === currentSessionTokenId;
	}

	onMount(async () => {
		// 사용자 정보 구독
		unsubscribe = authState.subscribe((state) => {
			_user = state.user;
		});

		// 현재 세션 토큰 ID 가져오기
		currentSessionTokenId = authStore.getCurrentSessionTokenId();
		console.log('Current session token ID:', currentSessionTokenId);

		await loadTokens();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	async function loadTokens() {
		try {
			isLoading = true;

			const response = await apiClient.getUserTokens();
			tokens = Array.isArray(response) ? response : [];
		} catch (error) {
			console.error('Failed to load tokens:', error);
			toast.error('토큰 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoading = false;
		}
	}

	async function _revokeToken(tokenId: number) {
		try {
			await apiClient.revokeToken(tokenId);
			toast.success('토큰이 취소되었습니다.');
			await loadTokens(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to revoke token:', error);
			toast.error('토큰 취소에 실패했습니다.');
		}
	}

	async function _revokeAllTokensForType(tokenType: TokenType) {
		const tokenTypeName = tokenType === TOKEN_TYPES.LOGIN ? '로그인' : 'OAuth2';

		try {
			await apiClient.revokeAllTokensForType(tokenType);
			toast.success(`모든 ${tokenTypeName} 토큰이 취소되었습니다.`);
			await loadTokens(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to revoke tokens:', error);
			toast.error(`${tokenTypeName} 토큰 취소에 실패했습니다.`);
		}
	}

	// 모달에서 실제 취소 실행
	async function confirmRevokeToken() {
		if (!selectedToken) return;

		isRevoking = true;
		try {
			await apiClient.revokeToken(selectedToken.id);
			toast.success('토큰이 취소되었습니다.');

			await loadTokens(); // 목록 새로고침

			// 로그인 토큰을 취소했고, 더 이상 로그인 토큰이 없으면 로그아웃
			if (selectedToken.tokenType === TOKEN_TYPES.LOGIN && loginTokens.length === 0) {
				await authStore.logout();
				return;
			}

			closeRevokeModal();
		} catch (error) {
			console.error('Failed to revoke token:', error);
			toast.error('토큰 취소에 실패했습니다.');
		} finally {
			isRevoking = false;
		}
	}

	async function confirmRevokeAllTokens() {
		if (!selectedTokenType) return;

		const tokenTypeName = selectedTokenType === TOKEN_TYPES.LOGIN ? '로그인' : 'OAuth2';
		isRevoking = true;

		try {
			await apiClient.revokeAllTokensForType(selectedTokenType);

			toast.success(`모든 ${tokenTypeName} 토큰이 취소되었습니다.`);

			// 로그인 토큰을 취소한 경우 로그아웃 처리
			if (selectedTokenType === TOKEN_TYPES.LOGIN) {
				await authStore.logout();
				// 페이지 리다이렉트는 authStore.logout()에서 처리됨
				return;
			}

			await loadTokens(); // 목록 새로고침
			closeRevokeAllModal();
		} catch (error) {
			console.error('Failed to revoke tokens:', error);
			toast.error(`${tokenTypeName} 토큰 취소에 실패했습니다.`);
		} finally {
			isRevoking = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString('ko-KR');
	}

	function isExpired(token: Token): boolean {
		return new Date() > new Date(token.expiresAt);
	}

	function getTokenStatus(token: Token): {
		label: string;
		variant: 'success' | 'warning' | 'secondary';
	} {
		if (isExpired(token)) {
			return { label: '만료됨', variant: 'warning' };
		}
		return { label: '활성', variant: 'success' };
	}

	function getTokenScopes(token: Token): string[] {
		if (!token.scopes) return [];

		// scopes가 이미 배열인 경우
		if (Array.isArray(token.scopes)) {
			return token.scopes.filter((scope) => scope && scope.length > 0);
		}

		// scopes가 문자열인 경우 (쉼표 또는 공백으로 구분)
		if (typeof token.scopes === 'string') {
			return token.scopes.split(/[,\s]+/).filter((scope) => scope.length > 0);
		}

		return [];
	}
</script>

<DashboardLayout
	title="토큰 관리"
	description="발급된 액세스 토큰과 리프레시 토큰을 관리하세요."
	showBackButton={true}
>
	<!-- 통계 카드 -->
	<div class="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-key text-lg text-blue-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">총 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">{currentTokens.length}</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-check-circle text-lg text-green-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">활성 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">
						{currentTokens.filter((t) => !isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-clock text-lg text-yellow-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">만료된 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">
						{currentTokens.filter((t) => isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-shield-alt text-lg text-purple-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">클라이언트 수</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">
						{new Set(currentTokens.map((t) => t.clientId).filter(Boolean)).size}
					</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- 토큰 목록 -->
	<Card>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-base font-medium text-gray-900 sm:text-lg">토큰 목록</h3>
			<div class="flex flex-col gap-2 sm:flex-row">
				<Button
					onclick={() => openRevokeAllModal(activeTab)}
					variant="outline"
					class="h-10 w-full border-red-300 text-red-600 hover:bg-red-50 sm:h-11 sm:w-auto"
				>
					<i class="fas fa-ban mr-2"></i>
					{activeTab === TOKEN_TYPES.LOGIN ? '모든 로그인 토큰 취소' : '모든 OAuth2 토큰 취소'}
				</Button>
			</div>
		</div>

		<!-- 토큰 타입 탭 -->
		<Tabs
			tabs={[
				{
					id: TOKEN_TYPES.LOGIN,
					label: `로그인 토큰 (${loginTokens.length})`,
					icon: 'fas fa-user'
				},
				{
					id: TOKEN_TYPES.OAUTH2,
					label: `OAuth2 토큰 (${oauth2Tokens.length})`,
					icon: 'fas fa-code-branch'
				}
			]}
			{activeTab}
			onTabChange={handleTabChange}
			class="mb-6"
		>
			{#snippet children({ activeTab: _currentActiveTab })}
				{#if isLoading}
					<div class="py-8 text-center">
						<i class="fas fa-spinner fa-spin mb-4 text-2xl text-gray-400"></i>
						<p class="text-gray-500">토큰 목록을 불러오는 중...</p>
					</div>
				{:else if currentTokens.length === 0}
					<div class="py-8 text-center">
						<i class="fas fa-key mb-4 text-4xl text-gray-400"></i>
						<p class="mb-4 text-gray-500">
							{activeTab === TOKEN_TYPES.LOGIN
								? '발급된 로그인 토큰이 없습니다.'
								: '발급된 OAuth2 토큰이 없습니다.'}
						</p>
					</div>
				{:else}
					<div class="space-y-3 sm:space-y-4">
						{#each currentTokens as token (token.id)}
							<div
								class="rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md sm:p-4"
							>
								<div
									class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
								>
									<div class="flex-1">
										<div
											class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3"
										>
											<h4 class="text-base font-medium text-gray-900 sm:text-lg">
												{token.tokenType === TOKEN_TYPES.LOGIN
													? 'Login Session'
													: token.client?.name || `Client ${token.clientId || 'Unknown'}`}
											</h4>
											<div class="flex flex-wrap gap-2">
												<Badge variant="info" size="sm">
													{token.tokenType}
												</Badge>
												<Badge {...getTokenStatus(token)} size="sm">
													{getTokenStatus(token).label}
												</Badge>
												{#if isCurrentSessionToken(token)}
													<Badge variant="success" size="sm">현재 세션</Badge>
												{/if}
											</div>
										</div>

										<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
											<div>
												<p class="text-xs font-medium text-gray-500">토큰 ID</p>
												<p class="mt-1 font-mono text-xs text-gray-900 sm:text-sm">#{token.id}</p>
											</div>

											<div>
												<p class="text-xs font-medium text-gray-500">권한 범위</p>
												<div class="mt-1 flex flex-wrap gap-1">
													{#each getTokenScopes(token) as scope (scope)}
														<Badge variant="secondary" size="sm">{scope}</Badge>
													{:else}
														<span class="text-xs sm:text-sm text-gray-500">없음</span>
													{/each}
												</div>
											</div>

											<div>
												<p class="text-xs font-medium text-gray-500">생성일</p>
												<p class="mt-1 text-xs text-gray-900 sm:text-sm">
													{formatDate(token.createdAt)}
												</p>
											</div>

											<div>
												<p class="text-xs font-medium text-gray-500">만료일</p>
												<p class="mt-1 text-xs text-gray-900 sm:text-sm">
													{formatDate(token.expiresAt)}
												</p>
											</div>

											{#if token.refreshToken && token.refreshExpiresAt}
												<div class="sm:col-span-2 lg:col-span-4">
													<p class="text-xs font-medium text-gray-500">리프레시 토큰 만료일</p>
													<p class="mt-1 text-xs text-gray-900 sm:text-sm">
														{formatDate(token.refreshExpiresAt)}
													</p>
												</div>
											{/if}
										</div>
									</div>

									<!-- 액션 버튼 -->
									<div class="flex gap-2 sm:ml-4 sm:flex-col">
										{#if !isExpired(token)}
											<Button
												variant="outline"
												size="sm"
												onclick={() => openRevokeModal(token)}
												class="h-9 flex-1 border-red-300 px-3 text-sm text-red-600 hover:bg-red-50 sm:h-8 sm:flex-none"
											>
												<i class="fas fa-ban mr-1 sm:mr-0"></i>
												<span class="sm:hidden">취소</span>
											</Button>
										{:else}
											<Button
												variant="outline"
												size="sm"
												disabled
												class="h-9 flex-1 px-3 text-sm text-gray-400 sm:h-8 sm:flex-none"
											>
												<i class="fas fa-clock mr-1 sm:mr-0"></i>
												<span class="sm:hidden">만료됨</span>
											</Button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/snippet}
		</Tabs>
	</Card>
	<!-- 토큰 관리 안내 -->
	<Card class="mt-4 sm:mt-6">
		<h3 class="mb-4 text-base font-medium text-gray-900 sm:text-lg">
			{activeTab === TOKEN_TYPES.LOGIN ? '로그인 토큰' : 'OAuth2 토큰'} 관리 안내
		</h3>

		{#if activeTab === TOKEN_TYPES.LOGIN}
			<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
				<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
					<div class="mb-2 flex items-center">
						<i class="fas fa-user mr-2 text-blue-600"></i>
						<h4 class="text-sm font-medium text-blue-900 sm:text-base">로그인 토큰</h4>
					</div>
					<p class="text-xs text-blue-800 sm:text-sm">
						사용자 로그인 시 발급되는 토큰입니다. 일반적인 API 접근에 사용됩니다.
					</p>
				</div>

				<div class="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
					<div class="mb-2 flex items-center">
						<i class="fas fa-redo mr-2 text-green-600"></i>
						<h4 class="text-sm font-medium text-green-900 sm:text-base">세션 관리</h4>
					</div>
					<p class="text-xs text-green-800 sm:text-sm">
						로그인 토큰은 사용자 세션을 유지하며, 자동으로 갱신될 수 있습니다.
					</p>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
				<div class="rounded-lg border border-purple-200 bg-purple-50 p-3 sm:p-4">
					<div class="mb-2 flex items-center">
						<i class="fas fa-code-branch mr-2 text-purple-600"></i>
						<h4 class="text-sm font-medium text-purple-900 sm:text-base">OAuth2 토큰</h4>
					</div>
					<p class="text-xs text-purple-800 sm:text-sm">
						타사 애플리케이션이 사용자 데이터에 접근하기 위해 발급되는 토큰입니다.
					</p>
				</div>

				<div class="rounded-lg border border-orange-200 bg-orange-50 p-3 sm:p-4">
					<div class="mb-2 flex items-center">
						<i class="fas fa-shield-alt mr-2 text-orange-600"></i>
						<h4 class="text-sm font-medium text-orange-900 sm:text-base">권한 범위</h4>
					</div>
					<p class="text-xs text-orange-800 sm:text-sm">
						OAuth2 토큰은 특정 권한 범위(scope)로 제한되며, 클라이언트별로 관리됩니다.
					</p>
				</div>
			</div>
		{/if}

		<div class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:mt-4 sm:p-4">
			<div class="mb-2 flex items-center">
				<i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>
				<h4 class="text-sm font-medium text-yellow-900 sm:text-base">보안 주의사항</h4>
			</div>
			<ul class="space-y-1 text-xs text-yellow-800 sm:text-sm">
				<li>• 의심스러운 활동이 발견되면 즉시 토큰을 취소하세요.</li>
				<li>• 정기적으로 사용하지 않는 토큰을 정리하세요.</li>
				<li>• 토큰이 유출되었다고 의심되면 모든 토큰을 취소하세요.</li>
				{#if activeTab === TOKEN_TYPES.OAUTH2}
					<li>• OAuth2 토큰은 타사 애플리케이션에 부여된 권한이므로 특히 주의하세요.</li>
				{/if}
			</ul>
		</div>
	</Card>
</DashboardLayout>

<!-- 단일 토큰 취소 모달 -->
<Modal
	open={showRevokeModal}
	title="토큰 취소 확인"
	onConfirm={confirmRevokeToken}
	onCancel={closeRevokeModal}
	onClose={closeRevokeModal}
	confirmText="취소"
	cancelText="닫기"
	confirmVariant="danger"
>
	{#if selectedToken}
		<div class="space-y-4">
			<p class="text-sm text-gray-600">
				다음 토큰을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</p>
			{#if isCurrentSessionToken(selectedToken)}
				<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">현재 로그인 세션 토큰입니다</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p>이 토큰을 취소하면 현재 로그인 세션이 종료됩니다. 계속하시겠습니까?</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
			<div class="rounded-lg bg-gray-50 p-4">
				<div class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
					<div>
						<span class="font-medium text-gray-700">토큰 ID:</span>
						<span class="ml-2 font-mono text-gray-900">{selectedToken.id}</span>
					</div>
					<div>
						<span class="font-medium text-gray-700">토큰 타입:</span>
						<Badge
							variant={selectedToken.tokenType === TOKEN_TYPES.LOGIN ? 'success' : 'info'}
							class="ml-2"
						>
							{selectedToken.tokenType === TOKEN_TYPES.LOGIN ? '로그인 토큰' : 'OAuth2 토큰'}
						</Badge>
						{#if isCurrentSessionToken(selectedToken)}
							<Badge variant="success" class="ml-2">현재 세션</Badge>
						{/if}
					</div>
					{#if selectedToken.client}
						<div class="sm:col-span-2">
							<span class="font-medium text-gray-700">클라이언트:</span>
							<span class="ml-2 text-gray-900">{selectedToken.client.name}</span>
						</div>
					{/if}
					<div>
						<span class="font-medium text-gray-700">만료일:</span>
						<span class="ml-2 text-gray-900"
							>{new Date(selectedToken.expiresAt).toLocaleString()}</span
						>
					</div>
				</div>
			</div>
		</div>
	{/if}
</Modal>

<!-- 전체 토큰 취소 모달 -->
<Modal
	open={showRevokeAllModal}
	title="전체 토큰 취소 확인"
	onConfirm={confirmRevokeAllTokens}
	onCancel={closeRevokeAllModal}
	onClose={closeRevokeAllModal}
	confirmText="모두 취소"
	cancelText="닫기"
	confirmVariant="danger"
>
	{#if selectedTokenType}
		<div class="space-y-4">
			<p class="text-sm text-gray-600">
				{selectedTokenType === TOKEN_TYPES.LOGIN ? '모든 로그인 토큰' : '모든 OAuth2 토큰'}을
				취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</p>
			<div class="rounded-lg bg-red-50 p-4">
				<div class="flex items-center">
					<i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>
					<div class="text-sm text-red-800">
						<strong>경고:</strong> 이 작업은 {selectedTokenType === TOKEN_TYPES.LOGIN
							? '모든 로그인 세션을 종료'
							: '모든 OAuth2 권한을 제거'}합니다.
					</div>
				</div>
			</div>
		</div>
	{/if}
</Modal>
