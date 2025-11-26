<script lang="ts">
	import { DashboardLayout, Button, Badge, apiClient, Tabs, DashboardSkeleton } from '$lib';
	import PasswordConfirmModal from '$lib/components/ui/PasswordConfirmModal.svelte';
	import { useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { Token } from '$lib/types/oauth.types';
	import { authState, authStore } from '$lib';
	import type { User } from '$lib';
	import { TOKEN_TYPES, type TokenType } from '$lib/types/authorization.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faKey,
		faCheckCircle,
		faClock,
		faShieldAlt,
		faList,
		faBan,
		faUser,
		faCodeBranch,
		faHashtag,
		faCalendarPlus,
		faCalendarTimes,
		faRedo,
		faInfoCircle,
		faExclamationTriangle
	} from '@fortawesome/free-solid-svg-icons';

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
	let _isRevoking = $state(false);
	let _isRevokingSingle = $state(false);
	let passwordError = $state('');

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
		passwordError = '';
	}

	function closeRevokeAllModal() {
		showRevokeAllModal = false;
		selectedTokenType = null;
		passwordError = '';
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

	// PasswordConfirmModal용 핸들러
	async function handleRevokeToken(password?: string) {
		if (!selectedToken || !password) return;

		_isRevokingSingle = true;

		try {
			await apiClient.revokeToken(selectedToken.id, password);
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
			_isRevokingSingle = false;
		}
	}

	// PasswordConfirmModal용 핸들러
	async function handleRevokeAllTokens(password?: string) {
		if (!selectedTokenType || !password) return;

		const tokenTypeName = selectedTokenType === TOKEN_TYPES.LOGIN ? '로그인' : 'OAuth2';
		_isRevoking = true;

		try {
			await apiClient.revokeAllTokensForType(selectedTokenType, password);
			toast.success(`모든 ${tokenTypeName} 토큰이 취소되었습니다.`);

			// 로그인 토큰을 취소한 경우 로그아웃 처리
			if (selectedTokenType === TOKEN_TYPES.LOGIN) {
				await authStore.logout();
				return;
			}

			await loadTokens(); // 목록 새로고침
			closeRevokeAllModal();
		} catch (error) {
			console.error('Failed to revoke tokens:', error);
			toast.error(`${tokenTypeName} 토큰 취소에 실패했습니다.`);
		} finally {
			_isRevoking = false;
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
		// 로그인 토큰의 경우 scopes가 없으므로 토큰 타입 표시
		if (token.tokenType === 'login') {
			return ['로그인 세션'];
		}

		// OAuth2 토큰의 경우 실제 scopes 표시
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
	description="발급된 액세스 토큰을 관리하세요."
	showBackButton={true}
>
	<!-- 통계 카드 -->
	{#if isLoading}
		<DashboardSkeleton type="stats" count={4} class="mb-6" />
	{:else}
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- 총 토큰 -->
			<div
				class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-neutral-50 p-4 shadow-sm ring-1 ring-stone-100 transition-all duration-200 hover:shadow-md"
			>
				<div class="relative flex items-center">
					<div class="shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-stone-100 to-neutral-100"
						>
							<FontAwesomeIcon icon={faKey} class="text-lg text-stone-600" />
						</div>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-gray-600">총 토큰</p>
						<p class="text-2xl font-bold text-gray-900">{currentTokens.length}</p>
					</div>
				</div>
			</div>

			<!-- 활성 토큰 -->
			<div
				class="relative overflow-hidden rounded-xl bg-linear-to-r from-neutral-50 to-gray-50 p-4 shadow-sm ring-1 ring-neutral-100 transition-all duration-200 hover:shadow-md"
			>
				<div class="relative flex items-center">
					<div class="shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-neutral-100 to-gray-100"
						>
							<FontAwesomeIcon icon={faCheckCircle} class="text-lg text-neutral-600" />
						</div>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-gray-600">활성 토큰</p>
						<p class="text-2xl font-bold text-gray-900">
							{currentTokens.filter((t) => !isExpired(t)).length}
						</p>
					</div>
				</div>
			</div>

			<!-- 만료된 토큰 -->
			<div
				class="relative overflow-hidden rounded-xl bg-linear-to-r from-gray-50 to-stone-50 p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:shadow-md"
			>
				<div class="relative flex items-center">
					<div class="shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-gray-100 to-stone-100"
						>
							<FontAwesomeIcon icon={faClock} class="text-lg text-gray-600" />
						</div>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-gray-600">만료된 토큰</p>
						<p class="text-2xl font-bold text-gray-900">
							{currentTokens.filter((t) => isExpired(t)).length}
						</p>
					</div>
				</div>
			</div>

			<!-- 클라이언트 수 -->
			<div
				class="relative overflow-hidden rounded-xl bg-linear-to-r from-slate-50 to-zinc-50 p-4 shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:shadow-md"
			>
				<div class="relative flex items-center">
					<div class="shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-100 to-zinc-100"
						>
							<FontAwesomeIcon icon={faShieldAlt} class="text-lg text-slate-600" />
						</div>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm font-medium text-gray-600">클라이언트 수</p>
						<p class="text-2xl font-bold text-gray-900">
							{new Set(currentTokens.map((t) => t.clientId).filter(Boolean)).size}
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- 토큰 목록 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-slate-50 to-gray-50 p-6 shadow-sm ring-1 ring-gray-100"
	>
		<div class="relative">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="flex items-center text-lg font-semibold text-gray-900">
					<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
						<FontAwesomeIcon icon={faList} class="text-slate-600" />
					</div>
					토큰 목록
				</h3>
				<div class="flex flex-col gap-2 sm:flex-row">
					<Button
						onclick={() => openRevokeAllModal(activeTab)}
						variant="outline"
						class="h-10 w-full border-red-300 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 sm:h-11 sm:w-auto"
					>
						<FontAwesomeIcon icon={faBan} class="mr-2" />
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
						icon: faUser
					},
					{
						id: TOKEN_TYPES.OAUTH2,
						label: `OAuth2 토큰 (${oauth2Tokens.length})`,
						icon: faCodeBranch
					}
				]}
				{activeTab}
				onTabChange={handleTabChange}
				class="mb-6"
			>
				{#snippet children({ activeTab: _currentActiveTab })}
					{#if isLoading}
						<DashboardSkeleton type="table" count={3} />
					{:else if currentTokens.length === 0}
						<div class="flex flex-col items-center justify-center py-12 text-center">
							<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
								<FontAwesomeIcon icon={faKey} class="text-2xl text-gray-400" />
							</div>
							<h4 class="mb-1 text-sm font-medium text-gray-900">
								{activeTab === TOKEN_TYPES.LOGIN
									? '발급된 로그인 토큰이 없습니다'
									: '발급된 OAuth2 토큰이 없습니다'}
							</h4>
							<p class="text-sm text-gray-500">토큰이 발급되면 여기에 표시됩니다.</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each currentTokens as token (token.id)}
								<div
									class="group relative overflow-hidden rounded-lg border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:shadow-sm"
								>
									<div
										class="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
									>
										<div class="flex-1">
											<div
												class="mb-3 flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3"
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

											<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
												<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100"
													>
														<FontAwesomeIcon icon={faHashtag} class="text-stone-600" />
													</div>
													<div class="flex-1">
														<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
															토큰 ID
														</p>
														<p class="text-sm font-medium text-gray-900">#{token.id}</p>
													</div>
												</div>

												<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100"
													>
														<FontAwesomeIcon icon={faShieldAlt} class="text-neutral-600" />
													</div>
													<div class="flex-1">
														<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
															권한 범위
														</p>
														<div class="mt-1 flex flex-wrap gap-1">
															{#each getTokenScopes(token) as scope (scope)}
																<Badge variant="secondary" size="sm">{scope}</Badge>
															{:else}
																<span class="text-xs text-gray-500">없음</span>
															{/each}
														</div>
													</div>
												</div>

												<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100"
													>
														<FontAwesomeIcon icon={faCalendarPlus} class="text-slate-600" />
													</div>
													<div class="flex-1">
														<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
															생성일
														</p>
														<p class="text-sm font-medium text-gray-900">
															{formatDate(token.createdAt)}
														</p>
													</div>
												</div>

												<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"
													>
														<FontAwesomeIcon icon={faCalendarTimes} class="text-gray-600" />
													</div>
													<div class="flex-1">
														<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
															만료일
														</p>
														<p class="text-sm font-medium text-gray-900">
															{formatDate(token.expiresAt)}
														</p>
													</div>
												</div>

												{#if token.refreshToken && token.refreshExpiresAt}
													<div
														class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3 sm:col-span-2 lg:col-span-4"
													>
														<div
															class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"
														>
															<FontAwesomeIcon icon={faRedo} class="text-gray-600" />
														</div>
														<div class="flex-1">
															<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
																리프레시 토큰 만료일
															</p>
															<p class="text-sm font-medium text-gray-900">
																{formatDate(token.refreshExpiresAt)}
															</p>
														</div>
													</div>
												{/if}
											</div>
										</div>

										<!-- 액션 버튼 -->
										<div class="flex gap-2 sm:ml-4 sm:flex-col sm:gap-2">
											<Button
												variant="outline"
												size="sm"
												onclick={() => openRevokeModal(token)}
												class="flex-1 border-red-300 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 sm:flex-none"
											>
												<FontAwesomeIcon icon={faBan} class="mr-2" />
												<span class="hidden sm:inline">취소</span>
											</Button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/snippet}
			</Tabs>
		</div>
	</div>
	<!-- 토큰 관리 안내 -->
	<div
		class="relative mt-6 overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-neutral-50 p-6 shadow-sm ring-1 ring-stone-100"
	>
		<div class="relative">
			<h3 class="mb-6 flex items-center text-lg font-semibold text-gray-900">
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faInfoCircle} class="text-stone-600" />
				</div>
				{activeTab === TOKEN_TYPES.LOGIN ? '로그인 토큰' : 'OAuth2 토큰'} 관리 안내
			</h3>

			{#if activeTab === TOKEN_TYPES.LOGIN}
				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex items-start space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100"
						>
							<FontAwesomeIcon icon={faUser} class="text-stone-600" />
						</div>
						<div>
							<h4 class="mb-2 text-base font-medium text-gray-900">로그인 토큰</h4>
							<p class="text-sm text-gray-600">
								사용자 로그인 시 발급되는 토큰입니다. 일반적인 API 접근에 사용됩니다.
							</p>
						</div>
					</div>

					<div class="flex items-start space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
							<FontAwesomeIcon icon={faRedo} class="text-gray-600" />
						</div>
						<div>
							<h4 class="mb-2 text-base font-medium text-gray-900">세션 관리</h4>
							<p class="text-sm text-gray-600">
								로그인 토큰은 사용자 세션을 유지하며, 자동으로 갱신될 수 있습니다.
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="flex items-start space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
							<FontAwesomeIcon icon={faCodeBranch} class="text-zinc-600" />
						</div>
						<div>
							<h4 class="mb-2 text-base font-medium text-gray-900">OAuth2 토큰</h4>
							<p class="text-sm text-gray-600">
								타사 애플리케이션이 사용자 데이터에 접근하기 위해 발급되는 토큰입니다.
							</p>
						</div>
					</div>

					<div class="flex items-start space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100"
						>
							<FontAwesomeIcon icon={faShieldAlt} class="text-neutral-600" />
						</div>
						<div>
							<h4 class="mb-2 text-base font-medium text-gray-900">권한 범위</h4>
							<p class="text-sm text-gray-600">
								OAuth2 토큰은 특정 권한 범위(scope)로 제한되며, 클라이언트별로 관리됩니다.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<div
				class="flex items-start space-x-4 rounded-lg border border-yellow-200 bg-white/60 p-4 backdrop-blur-sm"
			>
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100">
					<FontAwesomeIcon icon={faExclamationTriangle} class="text-yellow-600" />
				</div>
				<div>
					<h4 class="mb-2 text-base font-medium text-gray-900">보안 주의사항</h4>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• 의심스러운 활동이 발견되면 즉시 토큰을 취소하세요.</li>
						<li>• 정기적으로 사용하지 않는 토큰을 정리하세요.</li>
						<li>• 토큰이 유출되었다고 의심되면 모든 토큰을 취소하세요.</li>
						{#if activeTab === TOKEN_TYPES.OAUTH2}
							<li>• OAuth2 토큰은 타사 애플리케이션에 부여된 권한이므로 특히 주의하세요.</li>
						{/if}
					</ul>
				</div>
			</div>
		</div>
	</div>
</DashboardLayout>

<!-- 단일 토큰 취소 모달 -->
<PasswordConfirmModal
	open={showRevokeModal}
	title="토큰 취소 확인"
	message="다음 토큰을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다."
	confirmText="취소"
	cancelText="닫기"
	confirmVariant="danger"
	loading={_isRevokingSingle}
	requirePassword={true}
	passwordLabel="비밀번호 확인 (보안 강화)"
	passwordPlaceholder="계정 비밀번호를 입력하세요"
	{passwordError}
	onConfirm={handleRevokeToken}
	onCancel={closeRevokeModal}
	on:passwordError={(e) => (passwordError = e.detail)}
>
	{#if selectedToken}
		{#if isCurrentSessionToken(selectedToken)}
			<div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="flex">
					<div class="shrink-0">
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
							<p>이 토큰을 취소하면 현재 로그인 세션이 종료됩니다.</p>
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
	{/if}
</PasswordConfirmModal><!-- 전체 토큰 취소 모달 -->
<PasswordConfirmModal
	open={showRevokeAllModal}
	title="전체 토큰 취소 확인"
	message="{selectedTokenType === TOKEN_TYPES.LOGIN
		? '모든 로그인 토큰'
		: '모든 OAuth2 토큰'}을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다."
	confirmText="모두 취소"
	cancelText="닫기"
	confirmVariant="danger"
	loading={_isRevoking}
	requirePassword={true}
	passwordLabel="비밀번호 확인 (필수)"
	passwordPlaceholder="계정 비밀번호를 입력하세요"
	{passwordError}
	onConfirm={handleRevokeAllTokens}
	onCancel={closeRevokeAllModal}
	on:passwordError={(e) => (passwordError = e.detail)}
>
	{#if selectedTokenType}
		<div class="rounded-lg bg-red-50 p-4">
			<div class="flex items-center">
				<FontAwesomeIcon icon={faExclamationTriangle} class="mr-2 text-red-600" />
				<div class="text-sm text-red-800">
					<strong>경고:</strong> 이 작업은 {selectedTokenType === TOKEN_TYPES.LOGIN
						? '모든 로그인 세션을 종료'
						: '모든 OAuth2 권한을 제거'}합니다.
				</div>
			</div>
		</div>
	{/if}
</PasswordConfirmModal>
