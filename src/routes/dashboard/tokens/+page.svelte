<script lang="ts">
	import { Card, Button, Badge, Loading, Modal, Table, Dropdown, Tabs } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	// 토큰 관리 상태
	let accessTokens = $state<AccessToken[]>([]);
	let refreshTokens = $state<RefreshToken[]>([]);
	let authorizationCodes = $state<AuthorizationCode[]>([]);
	let isLoadingTokens = $state(false);

	// 토큰 취소 확인 모달
	let showRevokeModal = $state(false);
	let tokenToRevoke = $state<AccessToken | RefreshToken | null>(null);
	let isRevoking = $state(false);

	// 토큰 상세 정보 모달
	let showDetailsModal = $state(false);
	let selectedToken = $state<AccessToken | RefreshToken | null>(null);

	const toast = useToast();

	// 토큰 타입 정의
	interface AccessToken {
		id: string;
		token: string;
		clientId: string;
		clientName: string;
		scopes: string[];
		expiresAt: Date;
		createdAt: Date;
		lastUsed?: Date;
		isActive: boolean;
		ipAddress?: string;
		userAgent?: string;
	}

	interface RefreshToken {
		id: string;
		token: string;
		clientId: string;
		clientName: string;
		expiresAt: Date;
		createdAt: Date;
		lastUsed?: Date;
		isActive: boolean;
		accessTokenId?: string;
	}

	interface AuthorizationCode {
		id: string;
		code: string;
		clientId: string;
		clientName: string;
		redirectUri: string;
		scopes: string[];
		expiresAt: Date;
		createdAt: Date;
		isUsed: boolean;
	}

	// 테이블 컬럼 정의
	const accessTokenColumns = [
		{
			key: 'client',
			label: '클라이언트',
			sortable: true
		},
		{
			key: 'scopes',
			label: '권한',
			sortable: false
		},
		{
			key: 'status',
			label: '상태',
			sortable: true
		},
		{
			key: 'expiresAt',
			label: '만료일',
			sortable: true
		},
		{
			key: 'lastUsed',
			label: '마지막 사용',
			sortable: true
		},
		{
			key: 'actions',
			label: '작업',
			sortable: false
		}
	];

	const refreshTokenColumns = [
		{
			key: 'client',
			label: '클라이언트',
			sortable: true
		},
		{
			key: 'status',
			label: '상태',
			sortable: true
		},
		{
			key: 'expiresAt',
			label: '만료일',
			sortable: true
		},
		{
			key: 'lastUsed',
			label: '마지막 사용',
			sortable: true
		},
		{
			key: 'actions',
			label: '작업',
			sortable: false
		}
	];

	const authCodeColumns = [
		{
			key: 'client',
			label: '클라이언트',
			sortable: true
		},
		{
			key: 'scopes',
			label: '권한',
			sortable: false
		},
		{
			key: 'status',
			label: '상태',
			sortable: true
		},
		{
			key: 'expiresAt',
			label: '만료일',
			sortable: true
		},
		{
			key: 'createdAt',
			label: '생성일',
			sortable: true
		}
	];

	// 탭 설정
	const tabs = [
		{ id: 'access-tokens', label: '액세스 토큰', icon: 'fas fa-key' },
		{ id: 'refresh-tokens', label: '리프레시 토큰', icon: 'fas fa-sync' },
		{ id: 'auth-codes', label: '인증 코드', icon: 'fas fa-code' }
	];

	let activeTab = $state('access-tokens');

	onMount(async () => {
		await authStore.initialize();

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		await loadTokens();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 인증 상태에 따른 리다이렉트 처리
	$effect(() => {
		if (!isLoading && !isAuthenticated) {
			window.location.href = '/auth/login';
		}
	});

	async function loadTokens() {
		isLoadingTokens = true;
		try {
			// TODO: API 호출로 실제 토큰 목록 가져오기
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 임시 더미 데이터
			accessTokens = [
				{
					id: '1',
					token: 'at_1234567890abcdef',
					clientId: 'web-app-client-id',
					clientName: '웹 애플리케이션',
					scopes: ['read', 'write'],
					expiresAt: new Date(Date.now() + 3600000), // 1시간 후
					createdAt: new Date(Date.now() - 1800000), // 30분 전
					lastUsed: new Date(Date.now() - 300000), // 5분 전
					isActive: true,
					ipAddress: '192.168.1.100',
					userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
				},
				{
					id: '2',
					token: 'at_abcdef1234567890',
					clientId: 'mobile-app-client-id',
					clientName: '모바일 앱',
					scopes: ['read'],
					expiresAt: new Date(Date.now() + 7200000), // 2시간 후
					createdAt: new Date(Date.now() - 3600000), // 1시간 전
					lastUsed: new Date(Date.now() - 600000), // 10분 전
					isActive: true,
					ipAddress: '10.0.0.50',
					userAgent: 'FlowAuth-Mobile/1.0'
				},
				{
					id: '3',
					token: 'at_expired123456',
					clientId: 'dev-client-id',
					clientName: '개발용 클라이언트',
					scopes: ['read', 'write', 'admin'],
					expiresAt: new Date(Date.now() - 3600000), // 1시간 전 만료
					createdAt: new Date(Date.now() - 7200000), // 2시간 전
					lastUsed: new Date(Date.now() - 3700000), // 1시간 10분 전
					isActive: false,
					ipAddress: '127.0.0.1',
					userAgent: 'curl/7.68.0'
				}
			];

			refreshTokens = [
				{
					id: '1',
					token: 'rt_1234567890abcdef',
					clientId: 'web-app-client-id',
					clientName: '웹 애플리케이션',
					expiresAt: new Date(Date.now() + 86400000 * 30), // 30일 후
					createdAt: new Date(Date.now() - 1800000), // 30분 전
					lastUsed: new Date(Date.now() - 300000), // 5분 전
					isActive: true,
					accessTokenId: '1'
				},
				{
					id: '2',
					token: 'rt_abcdef1234567890',
					clientId: 'mobile-app-client-id',
					clientName: '모바일 앱',
					expiresAt: new Date(Date.now() + 86400000 * 30), // 30일 후
					createdAt: new Date(Date.now() - 3600000), // 1시간 전
					lastUsed: new Date(Date.now() - 600000), // 10분 전
					isActive: true,
					accessTokenId: '2'
				}
			];

			authorizationCodes = [
				{
					id: '1',
					code: 'ac_1234567890',
					clientId: 'web-app-client-id',
					clientName: '웹 애플리케이션',
					redirectUri: 'https://example.com/callback',
					scopes: ['read', 'write'],
					expiresAt: new Date(Date.now() + 600000), // 10분 후
					createdAt: new Date(Date.now() - 60000), // 1분 전
					isUsed: false
				},
				{
					id: '2',
					code: 'ac_abcdef1234',
					clientId: 'mobile-app-client-id',
					clientName: '모바일 앱',
					redirectUri: 'com.example.app://callback',
					scopes: ['read'],
					expiresAt: new Date(Date.now() - 300000), // 5분 전 만료
					createdAt: new Date(Date.now() - 900000), // 15분 전
					isUsed: true
				}
			];
		} catch (error) {
			console.error('Failed to load tokens:', error);
			toast.error('토큰 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoadingTokens = false;
		}
	}

	function openRevokeModal(token: AccessToken | RefreshToken) {
		tokenToRevoke = token;
		showRevokeModal = true;
	}

	function closeRevokeModal() {
		showRevokeModal = false;
		tokenToRevoke = null;
	}

	async function revokeToken() {
		if (!tokenToRevoke) return;

		isRevoking = true;
		try {
			// TODO: API 호출로 토큰 취소
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 토큰 상태 업데이트
			if ('scopes' in tokenToRevoke) {
				// Access Token
				accessTokens = accessTokens.map(token => 
					token.id === tokenToRevoke!.id 
						? { ...token, isActive: false }
						: token
				);
			} else {
				// Refresh Token
				refreshTokens = refreshTokens.map(token => 
					token.id === tokenToRevoke!.id 
						? { ...token, isActive: false }
						: token
				);
			}

			closeRevokeModal();
			toast.success('토큰이 성공적으로 취소되었습니다.');
		} catch (error) {
			console.error('Failed to revoke token:', error);
			toast.error('토큰 취소에 실패했습니다.');
		} finally {
			isRevoking = false;
		}
	}

	function showTokenDetails(token: AccessToken | RefreshToken) {
		selectedToken = token;
		showDetailsModal = true;
	}

	function closeDetailsModal() {
		showDetailsModal = false;
		selectedToken = null;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			toast.success('클립보드에 복사되었습니다.');
		}).catch(() => {
			toast.error('복사에 실패했습니다.');
		});
	}

	function navigateBack() {
		window.location.href = '/dashboard';
	}

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	// 만료 상태 확인
	function isExpired(date: Date): boolean {
		return date < new Date();
	}

	// 테이블 데이터 타입 정의
	interface AccessTokenTableData {
		id: string;
		client: string;
		scopes: string[];
		status: boolean;
		expiresAt: Date;
		lastUsed: Date | undefined;
		_original: AccessToken;
	}

	interface RefreshTokenTableData {
		id: string;
		client: string;
		status: boolean;
		expiresAt: Date;
		lastUsed: Date | undefined;
		_original: RefreshToken;
	}

	interface AuthCodeTableData {
		id: string;
		client: string;
		scopes: string[];
		status: boolean;
		expiresAt: Date;
		createdAt: Date;
		_original: AuthorizationCode;
	}

	// 테이블 데이터 가공
	const accessTokenTableData = $derived<AccessTokenTableData[]>(accessTokens.map(token => ({
		id: token.id,
		client: token.clientName,
		scopes: token.scopes,
		status: token.isActive && !isExpired(token.expiresAt),
		expiresAt: token.expiresAt,
		lastUsed: token.lastUsed,
		_original: token
	})));

	const refreshTokenTableData = $derived<RefreshTokenTableData[]>(refreshTokens.map(token => ({
		id: token.id,
		client: token.clientName,
		status: token.isActive && !isExpired(token.expiresAt),
		expiresAt: token.expiresAt,
		lastUsed: token.lastUsed,
		_original: token
	})));

	const authCodeTableData = $derived<AuthCodeTableData[]>(authorizationCodes.map(code => ({
		id: code.id,
		client: code.clientName,
		scopes: code.scopes,
		status: !code.isUsed && !isExpired(code.expiresAt),
		expiresAt: code.expiresAt,
		createdAt: code.createdAt,
		_original: code
	})));

	// 통계 계산
	const totalActiveTokens = $derived(accessTokens.filter(t => t.isActive && !isExpired(t.expiresAt)).length);
	const totalActiveRefreshTokens = $derived(refreshTokens.filter(t => t.isActive && !isExpired(t.expiresAt)).length);
	const totalUnusedCodes = $derived(authorizationCodes.filter(c => !c.isUsed && !isExpired(c.expiresAt)).length);
</script>

<svelte:head>
	<title>토큰 관리 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="토큰 정보를 불러오는 중..." />
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={navigateBack}
							class="text-gray-600 hover:text-gray-900"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							대시보드로
						</Button>
						<div class="h-6 w-px bg-gray-300"></div>
						<h1 class="text-xl font-semibold text-gray-900">토큰 관리</h1>
					</div>
					<div class="flex items-center space-x-4">
						<div class="hidden sm:block">
							<span class="text-sm text-gray-600">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={handleLogout}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-sign-out-alt mr-2"></i>
							로그아웃
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 페이지 헤더 -->
				<div>
					<h2 class="text-2xl font-bold text-gray-900">토큰 관리</h2>
					<p class="mt-1 text-sm text-gray-600">
						액세스 토큰, 리프레시 토큰, 인증 코드를 관리하고 모니터링하세요.
					</p>
				</div>

				<!-- 통계 카드 -->
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-4">
					<Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-key text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">활성 액세스 토큰</p>
								<p class="text-2xl font-bold">{totalActiveTokens}</p>
							</div>
						</div>
					</Card>

					<Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-sync text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">활성 리프레시 토큰</p>
								<p class="text-2xl font-bold">{totalActiveRefreshTokens}</p>
							</div>
						</div>
					</Card>

					<Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-code text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">사용 가능한 인증 코드</p>
								<p class="text-2xl font-bold">{totalUnusedCodes}</p>
							</div>
						</div>
					</Card>

					<Card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-chart-line text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">총 발급된 토큰</p>
								<p class="text-2xl font-bold">{accessTokens.length + refreshTokens.length}</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- 토큰 관리 탭 -->
				<Card>
					<Tabs {tabs} bind:activeTab>
						{#snippet children({ activeTab })}
							{#if activeTab === 'access-tokens'}
								<!-- 액세스 토큰 탭 -->
								<div class="space-y-4">
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold text-gray-900">액세스 토큰</h3>
										{#if isLoadingTokens}
											<Loading variant="spinner" size="sm" />
										{/if}
									</div>

									{#if accessTokens.length === 0}
										<div class="py-12 text-center">
											<i class="fas fa-key mx-auto mb-4 text-4xl text-gray-400"></i>
											<p class="text-lg font-medium text-gray-900">발급된 액세스 토큰이 없습니다</p>
											<p class="mt-1 text-gray-600">클라이언트 애플리케이션에서 인증을 진행하면 토큰이 표시됩니다.</p>
										</div>
									{:else}
										<Table columns={accessTokenColumns} data={accessTokenTableData}>
											{#snippet cell({ column, row })}
												{#if column.key === 'client'}
													<div>
														<p class="font-medium text-gray-900">{row.client}</p>
														<code class="text-xs text-gray-500">{row._original.clientId}</code>
													</div>
												{:else if column.key === 'scopes'}
													<div class="flex flex-wrap gap-1">
														{#each row.scopes as scope}
															<Badge variant="info" size="sm">{scope}</Badge>
														{/each}
													</div>
												{:else if column.key === 'status'}
													{#if isExpired(row._original.expiresAt)}
														<Badge variant="warning" size="sm">만료됨</Badge>
													{:else if row.status}
														<Badge variant="success" size="sm">활성</Badge>
													{:else}
														<Badge variant="warning" size="sm">비활성</Badge>
													{/if}
												{:else if column.key === 'expiresAt'}
													<div class="text-sm">
														<div class="text-gray-900">{row.expiresAt.toLocaleDateString('ko-KR')}</div>
														<div class="text-gray-500">{row.expiresAt.toLocaleTimeString('ko-KR')}</div>
													</div>
												{:else if column.key === 'lastUsed'}
													<span class="text-sm text-gray-600">
														{row.lastUsed ? row.lastUsed.toLocaleDateString('ko-KR') : '사용 안함'}
													</span>
												{:else if column.key === 'actions'}
													<Dropdown>
														{#snippet trigger()}
															<Button variant="outline" size="sm">
																<i class="fas fa-ellipsis-v"></i>
															</Button>
														{/snippet}
														{#snippet content()}
															<button
																class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
																onclick={() => showTokenDetails(row._original)}
															>
																<i class="fas fa-info-circle mr-2"></i>
																상세 정보
															</button>
															{#if row.status}
																<button
																	class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
																	onclick={() => openRevokeModal(row._original)}
																>
																	<i class="fas fa-ban mr-2"></i>
																	토큰 취소
																</button>
															{/if}
														{/snippet}
													</Dropdown>
												{/if}
											{/snippet}
										</Table>
									{/if}
								</div>
							{:else if activeTab === 'refresh-tokens'}
								<!-- 리프레시 토큰 탭 -->
								<div class="space-y-4">
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold text-gray-900">리프레시 토큰</h3>
										{#if isLoadingTokens}
											<Loading variant="spinner" size="sm" />
										{/if}
									</div>

									{#if refreshTokens.length === 0}
										<div class="py-12 text-center">
											<i class="fas fa-sync mx-auto mb-4 text-4xl text-gray-400"></i>
											<p class="text-lg font-medium text-gray-900">발급된 리프레시 토큰이 없습니다</p>
											<p class="mt-1 text-gray-600">클라이언트 애플리케이션에서 인증을 진행하면 토큰이 표시됩니다.</p>
										</div>
									{:else}
										<Table columns={refreshTokenColumns} data={refreshTokenTableData}>
											{#snippet cell({ column, row })}
												{#if column.key === 'client'}
													<div>
														<p class="font-medium text-gray-900">{row.client}</p>
														<code class="text-xs text-gray-500">{row._original.clientId}</code>
													</div>
												{:else if column.key === 'status'}
													{#if isExpired(row._original.expiresAt)}
														<Badge variant="warning" size="sm">만료됨</Badge>
													{:else if row.status}
														<Badge variant="success" size="sm">활성</Badge>
													{:else}
														<Badge variant="warning" size="sm">비활성</Badge>
													{/if}
												{:else if column.key === 'expiresAt'}
													<div class="text-sm">
														<div class="text-gray-900">{row.expiresAt.toLocaleDateString('ko-KR')}</div>
														<div class="text-gray-500">{row.expiresAt.toLocaleTimeString('ko-KR')}</div>
													</div>
												{:else if column.key === 'lastUsed'}
													<span class="text-sm text-gray-600">
														{row.lastUsed ? row.lastUsed.toLocaleDateString('ko-KR') : '사용 안함'}
													</span>
												{:else if column.key === 'actions'}
													<Dropdown>
														{#snippet trigger()}
															<Button variant="outline" size="sm">
																<i class="fas fa-ellipsis-v"></i>
															</Button>
														{/snippet}
														{#snippet content()}
															<button
																class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
																onclick={() => showTokenDetails(row._original)}
															>
																<i class="fas fa-info-circle mr-2"></i>
																상세 정보
															</button>
															{#if row.status}
																<button
																	class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
																	onclick={() => openRevokeModal(row._original)}
																>
																	<i class="fas fa-ban mr-2"></i>
																	토큰 취소
																</button>
															{/if}
														{/snippet}
													</Dropdown>
												{/if}
											{/snippet}
										</Table>
									{/if}
								</div>
							{:else if activeTab === 'auth-codes'}
								<!-- 인증 코드 탭 -->
								<div class="space-y-4">
									<div class="flex items-center justify-between">
										<h3 class="text-lg font-semibold text-gray-900">인증 코드</h3>
										{#if isLoadingTokens}
											<Loading variant="spinner" size="sm" />
										{/if}
									</div>

									{#if authorizationCodes.length === 0}
										<div class="py-12 text-center">
											<i class="fas fa-code mx-auto mb-4 text-4xl text-gray-400"></i>
											<p class="text-lg font-medium text-gray-900">발급된 인증 코드가 없습니다</p>
											<p class="mt-1 text-gray-600">OAuth2 인증 과정에서 생성된 인증 코드가 표시됩니다.</p>
										</div>
									{:else}
										<Table columns={authCodeColumns} data={authCodeTableData}>
											{#snippet cell({ column, row })}
												{#if column.key === 'client'}
													<div>
														<p class="font-medium text-gray-900">{row.client}</p>
														<code class="text-xs text-gray-500">{row._original.clientId}</code>
													</div>
												{:else if column.key === 'scopes'}
													<div class="flex flex-wrap gap-1">
														{#each row.scopes as scope}
															<Badge variant="info" size="sm">{scope}</Badge>
														{/each}
													</div>
												{:else if column.key === 'status'}
													{#if row._original.isUsed}
														<Badge variant="warning" size="sm">사용됨</Badge>
													{:else if isExpired(row._original.expiresAt)}
														<Badge variant="warning" size="sm">만료됨</Badge>
													{:else}
														<Badge variant="success" size="sm">사용 가능</Badge>
													{/if}
												{:else if column.key === 'expiresAt'}
													<div class="text-sm">
														<div class="text-gray-900">{row.expiresAt.toLocaleDateString('ko-KR')}</div>
														<div class="text-gray-500">{row.expiresAt.toLocaleTimeString('ko-KR')}</div>
													</div>
												{:else if column.key === 'createdAt'}
													<span class="text-sm text-gray-600">
														{row.createdAt.toLocaleDateString('ko-KR')}
													</span>
												{/if}
											{/snippet}
										</Table>
									{/if}
								</div>
							{/if}
						{/snippet}
					</Tabs>
				</Card>
			</div>
		</main>
	</div>

	<!-- 토큰 취소 확인 모달 -->
	{#if showRevokeModal && tokenToRevoke}
		<Modal
			title="토큰 취소 확인"
			open={showRevokeModal}
			onClose={closeRevokeModal}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="rounded-lg bg-red-50 border border-red-200 p-4">
						<div class="flex">
							<i class="fas fa-exclamation-triangle text-red-400 mr-2 mt-0.5"></i>
							<div>
								<h4 class="text-sm font-medium text-red-800">주의!</h4>
								<p class="text-sm text-red-700 mt-1">
									이 작업은 되돌릴 수 없습니다. 토큰이 취소되면 해당 클라이언트는 다시 인증해야 합니다.
								</p>
							</div>
						</div>
					</div>

					<div>
						<p class="text-sm text-gray-600 mb-2">취소할 토큰 정보:</p>
						<div class="rounded-lg bg-gray-50 p-3">
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-gray-600">클라이언트:</span>
									<span class="text-gray-900">{'clientName' in tokenToRevoke ? tokenToRevoke.clientName : 'Unknown'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">토큰 ID:</span>
									<code class="text-gray-900">{tokenToRevoke.id}</code>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-600">생성일:</span>
									<span class="text-gray-900">{tokenToRevoke.createdAt.toLocaleDateString('ko-KR')}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={closeRevokeModal} disabled={isRevoking}>
					취소
				</Button>
				<Button onclick={revokeToken} disabled={isRevoking} class="bg-red-600 hover:bg-red-700">
					{#if isRevoking}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-ban mr-2"></i>
					{/if}
					토큰 취소
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- 토큰 상세 정보 모달 -->
	{#if showDetailsModal && selectedToken}
		<Modal
			title="토큰 상세 정보"
			open={showDetailsModal}
			onClose={closeDetailsModal}
			size="lg"
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">토큰 ID</label>
							<div class="flex items-center space-x-2">
								<code class="flex-1 rounded bg-gray-100 px-2 py-1 text-sm">{selectedToken.id}</code>
								<Button
									variant="outline"
									size="sm"
									onclick={() => copyToClipboard(selectedToken!.id)}
									class="p-1"
								>
									<i class="fas fa-copy text-xs"></i>
								</Button>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">클라이언트</label>
							<p class="text-sm text-gray-900">{'clientName' in selectedToken ? selectedToken.clientName : 'Unknown'}</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">생성일</label>
							<p class="text-sm text-gray-900">{selectedToken.createdAt.toLocaleString('ko-KR')}</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">만료일</label>
							<p class="text-sm text-gray-900">{selectedToken.expiresAt.toLocaleString('ko-KR')}</p>
						</div>

						{#if selectedToken.lastUsed}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">마지막 사용</label>
								<p class="text-sm text-gray-900">{selectedToken.lastUsed.toLocaleString('ko-KR')}</p>
							</div>
						{/if}

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
							{#if isExpired(selectedToken.expiresAt)}
								<Badge variant="warning" size="sm">만료됨</Badge>
							{:else if selectedToken.isActive}
								<Badge variant="success" size="sm">활성</Badge>
							{:else}
								<Badge variant="warning" size="sm">비활성</Badge>
							{/if}
						</div>
					</div>

					{#if 'scopes' in selectedToken}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">권한 스코프</label>
							<div class="flex flex-wrap gap-1">
								{#each selectedToken.scopes as scope}
									<Badge variant="info" size="sm">{scope}</Badge>
								{/each}
							</div>
						</div>
					{/if}

					{#if 'ipAddress' in selectedToken}
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">IP 주소</label>
								<p class="text-sm text-gray-900">{selectedToken.ipAddress || 'N/A'}</p>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
								<p class="text-sm text-gray-900 truncate" title={selectedToken.userAgent}>
									{selectedToken.userAgent || 'N/A'}
								</p>
							</div>
						</div>
					{/if}
				</div>
			{/snippet}
			{#snippet footer()}
				<Button onclick={closeDetailsModal}>
					닫기
				</Button>
			{/snippet}
		</Modal>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<Card class="w-full max-w-md">
			<div class="text-center">
				<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인증 필요</h2>
				<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
				<Button onclick={() => (window.location.href = '/auth/login')}>
					로그인하기
				</Button>
			</div>
		</Card>
	</div>
{/if}