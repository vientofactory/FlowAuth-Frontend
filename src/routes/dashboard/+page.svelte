<script lang="ts">
	import {
		DashboardLayout,
		Card,
		Button,
		Badge,
		Tabs,
		apiClient,
		authState,
		useToast,
		PermissionUtils
	} from '$lib';
	import Chart from '$lib/components/Chart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
	import { USER_TYPES } from '$lib/types/user.types';
	import { usePermissions } from '$lib/composables/usePermissions';

	let user = $state<User | null>(null);
	let _isLoading = $state(true);
	let isDashboardLoading = $state(false);
	let isDashboardDataLoaded = $state(false);

	let dashboardStats = $state({
		totalClients: 0,
		activeTokens: 0,
		totalTokensIssued: 0,
		expiredTokens: 0,
		revokedTokens: 0,
		lastLoginDate: null as string | null,
		accountCreated: null as string | null,
		tokenIssuanceByHour: [] as Array<{ hour: string; count: number }>,
		tokenIssuanceByDay: [] as Array<{ date: string; count: number }>,
		clientUsageStats: [] as Array<{
			clientName: string;
			tokenCount: number;
			percentage: number;
		}>,
		scopeUsageStats: [] as Array<{
			scope: string;
			count: number;
			percentage: number;
		}>,
		tokenExpirationRate: 0,
		averageTokenLifetime: 0,
		insights: {
			trends: '',
			recommendations: '',
			alerts: ''
		}
	});

	// 권한 관련 상태
	const { canManageSystem, isClientManager, isTokenManager, isUserManager, roleName } =
		usePermissions();

	// 파생 상태
	const _hasManageSystemPermission = $derived($canManageSystem);
	const isDeveloper = $derived($isClientManager || $isTokenManager || $isUserManager);

	// 사용자 유형별 대시보드 설정
	const userTypeConfig = $derived.by(() => {
		if (!user) return null;

		return {
			title: isDeveloper ? '개발자 대시보드' : '사용자 대시보드',
			description: isDeveloper
				? 'OAuth2 클라이언트와 토큰을 관리하고 모니터링하세요.'
				: '계정을 관리하고 OAuth2 로그인을 이용하세요.',
			stats: [
				{
					label: '클라이언트',
					value: dashboardStats.totalClients,
					icon: 'fas fa-users',
					color: 'from-blue-500 to-blue-600',
					show: isDeveloper
				},
				{
					label: '토큰',
					value: dashboardStats.activeTokens,
					icon: 'fas fa-key',
					color: 'from-green-500 to-green-600',
					show: true
				},
				{
					label: '로그인',
					value: dashboardStats.lastLoginDate
						? new Date(dashboardStats.lastLoginDate).toLocaleDateString('ko-KR', {
								month: 'short',
								day: 'numeric'
							})
						: 'N/A',
					icon: 'fas fa-clock',
					color: 'from-purple-500 to-purple-600',
					show: true
				},
				{
					label: '계정',
					value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A',
					icon: 'fas fa-calendar',
					color: 'from-orange-500 to-orange-600',
					show: true
				},
				{
					label: '권한',
					value: $roleName,
					icon: 'fas fa-shield-alt',
					color: 'from-red-500 to-red-600',
					show: true
				}
			].filter((stat) => stat.show),
			quickActions: isDeveloper
				? [
						{
							label: '클라이언트\n생성',
							icon: 'fas fa-plus-circle',
							color: 'blue',
							action: navigateToClients
						},
						{
							label: '토큰\n관리',
							icon: 'fas fa-key',
							color: 'green',
							action: navigateToTokens
						},
						{
							label: 'OAuth2\n테스터',
							icon: 'fas fa-link',
							color: 'orange',
							action: navigateToOAuthTester
						}
					]
				: [
						{
							label: '프로필\n편집',
							icon: 'fas fa-user-edit',
							color: 'blue',
							action: navigateToProfile
						},
						{
							label: '토큰\n관리',
							icon: 'fas fa-key',
							color: 'green',
							action: navigateToTokens
						}
					]
		};
	});

	let recentActivities = $state<
		{
			id: number;
			type: string;
			description: string;
			createdAt: string | Date;
			resourceId?: number;
			metadata?: {
				clientName?: string;
				clientId?: number;
				scopes?: string[];
				reason?: string;
				activity?: string;
				location?: string;
				userId?: number;
				details?: {
					scopes?: string[];
					expiresAt?: string;
					isActive?: boolean;
					isConfidential?: boolean;
					description?: string;
					createdAt?: string;
					updatedAt?: string;
					tokenId?: number;
				};
			};
		}[]
	>([]);

	const toast = useToast();

	// 활동 타입별 아이콘과 색상
	function getActivityIcon(type: string): { icon: string; color: string } {
		switch (type) {
			case 'login':
				return { icon: 'fas fa-sign-in-alt', color: 'bg-blue-100 text-blue-600' };
			case 'account_created':
				return { icon: 'fas fa-user-plus', color: 'bg-emerald-100 text-emerald-600' };
			case 'client_created':
				return { icon: 'fas fa-plus', color: 'bg-purple-100 text-purple-600' };
			case 'token_created':
				return { icon: 'fas fa-key', color: 'bg-green-100 text-green-600' };
			case 'client_updated':
				return { icon: 'fas fa-edit', color: 'bg-orange-100 text-orange-600' };
			case 'token_revoked':
				return { icon: 'fas fa-ban', color: 'bg-red-100 text-red-600' };
			default:
				return { icon: 'fas fa-circle', color: 'bg-gray-100 text-gray-600' };
		}
	}

	// 상대적 시간 표시
	function getRelativeTime(dateInput: string | Date): string {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 1) return '방금 전';
		if (diffMins < 60) return `${diffMins}분 전`;
		if (diffHours < 24) return `${diffHours}시간 전`;
		if (diffDays < 7) return `${diffDays}일 전`;
		return date.toLocaleDateString('ko-KR');
	}

	// 탭 설정
	const tabs = [
		{ id: 'overview', label: '개요', icon: 'fas fa-tachometer-alt' },
		{ id: 'analytics', label: '분석', icon: 'fas fa-chart-line' },
		{ id: 'activity', label: '최근 활동', icon: 'fas fa-clock' },
		{ id: 'quick-actions', label: '빠른 작업', icon: 'fas fa-bolt' }
	];

	let activeTab = $state('overview');

	onMount(() => {
		// store 구독
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			_isLoading = state.isLoading;

			// authState 초기화가 완료되고 로딩이 끝나고 user가 있고 아직 대시보드 데이터를 로드하지 않은 경우에만 로드
			if (
				state.isInitialized &&
				!state.isLoading &&
				user &&
				!isDashboardLoading &&
				!isDashboardDataLoaded
			) {
				loadDashboardData().catch(console.error);
			}

			// user가 로드되면 accountCreated 업데이트
			if (user?.createdAt && dashboardStats.accountCreated !== user.createdAt) {
				dashboardStats.accountCreated = user.createdAt;
			}
		});

		return unsubscribe;
	});
	async function loadDashboardData() {
		if (isDashboardLoading) return; // 이미 로딩 중이면 중복 호출 방지

		try {
			isDashboardLoading = true;

			// 실제 API 호출로 대시보드 통계 가져오기
			const [stats, activities] = await Promise.all([
				apiClient.getDashboardStats(),
				apiClient.getRecentActivities(5)
			]);

			dashboardStats = {
				...stats,
				// user 객체에서 accountCreated가 없으면 API 응답 사용
				accountCreated: user?.createdAt || stats.accountCreated
			};

			recentActivities = activities;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
			// API 호출 실패 시 user 객체에서 데이터 사용
			dashboardStats = {
				totalClients: 0,
				activeTokens: 0,
				totalTokensIssued: 0,
				expiredTokens: 0,
				revokedTokens: 0,
				lastLoginDate: null,
				accountCreated: user?.createdAt || null,
				tokenIssuanceByHour: [],
				tokenIssuanceByDay: [],
				clientUsageStats: [],
				scopeUsageStats: [],
				tokenExpirationRate: 0,
				averageTokenLifetime: 0,
				insights: {
					trends: '',
					recommendations: '',
					alerts: ''
				}
			};
			toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
		} finally {
			isDashboardLoading = false;
			isDashboardDataLoaded = true; // 데이터 로드 시도 완료 표시
		}
	}

	// 색상 설정 상수
	const COLOR_CLASSES = {
		blue: {
			hover: 'hover:border-blue-500 hover:bg-blue-50',
			background: 'bg-blue-100 group-hover:bg-blue-200',
			text: 'text-blue-600'
		},
		green: {
			hover: 'hover:border-green-500 hover:bg-green-50',
			background: 'bg-green-100 group-hover:bg-green-200',
			text: 'text-green-600'
		},
		purple: {
			hover: 'hover:border-purple-500 hover:bg-purple-50',
			background: 'bg-purple-100 group-hover:bg-purple-200',
			text: 'text-purple-600'
		},
		orange: {
			hover: 'hover:border-orange-500 hover:bg-orange-50',
			background: 'bg-orange-100 group-hover:bg-orange-200',
			text: 'text-orange-600'
		}
	} as const;

	// 그리드 컬럼 수 계산 함수
	function getGridColsClass(count: number, type: 'stats' | 'actions' = 'stats'): string {
		if (type === 'actions') {
			switch (count) {
				case 1:
					return 'grid-cols-1';
				case 2:
					return 'grid-cols-1 sm:grid-cols-2';
				case 3:
					return 'grid-cols-2 sm:grid-cols-3';
				default:
					return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
			}
		} else {
			switch (count) {
				case 1:
					return 'grid-cols-1';
				case 2:
					return 'grid-cols-1 sm:grid-cols-2';
				case 3:
					return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
				default:
					return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
			}
		}
	}

	// 통계 라벨 표시 함수
	function getStatBadgeText(label: string): string {
		switch (label) {
			case '클라이언트':
				return '총계';
			case '토큰':
				return '활성';
			case '로그인':
				return '최근';
			case '계정':
				return '생성';
			default:
				return '';
		}
	}

	// 빠른 액션 함수들
	function navigateToProfile() {
		goto('/dashboard/profile');
	}

	function navigateToClients() {
		goto('/dashboard/clients');
	}

	function navigateToTokens() {
		goto('/dashboard/tokens');
	}

	function _navigateToSettings() {
		goto('/dashboard/settings');
	}

	function navigateToOAuthTester() {
		goto('/dashboard/oauth-tester');
	}
</script>

<DashboardLayout
	title={userTypeConfig?.title || '대시보드'}
	description={userTypeConfig?.description || 'OAuth2 인증 시스템을 관리하고 모니터링하세요.'}
>
	<!-- 통계 카드들 -->
	{#if userTypeConfig}
		<div class="mb-6 grid gap-4 {getGridColsClass(userTypeConfig.stats.length, 'stats')}">
			{#each userTypeConfig.stats as stat, index (stat.label || `stat-${index}`)}
				{#if isDashboardLoading}
					<!-- 스켈레톤 로딩 카드 -->
					<div class="group relative animate-pulse overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6 shadow-sm">
						<div class="flex items-center justify-between">
							<div class="flex-1 space-y-3">
								<div class="flex items-center justify-between">
									<div class="h-5 w-5 rounded-lg bg-gray-400/60"></div>
									<div class="h-3 w-12 rounded bg-gray-400/40"></div>
								</div>
								<div class="h-4 w-20 rounded bg-gray-400/50"></div>
								<div class="h-7 w-16 rounded bg-gray-400/70"></div>
							</div>
						</div>
						<div class="absolute -right-2 -bottom-2 opacity-20">
							<div class="h-16 w-16 rounded-full bg-gray-400/30"></div>
						</div>
					</div>
				{:else}
					<!-- 실제 통계 카드 -->
					<div class="group relative overflow-hidden rounded-xl bg-gradient-to-br {stat.color} p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
						<div class="relative z-10">
							<div class="flex items-center justify-between mb-4">
								<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
									<i class="{stat.icon} text-xl"></i>
								</div>
							</div>
							<div class="space-y-1">
								<p class="text-sm font-medium text-white/80">{stat.label}</p>
								<p class="text-2xl font-bold tracking-tight">{stat.value}</p>
							</div>
						</div>
						<!-- 배경 장식 -->
						<div class="absolute -right-4 -bottom-4 opacity-10">
							<i class="{stat.icon} text-6xl"></i>
						</div>
						<div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- 탭 인터페이스 -->
	<div class="mb-6 overflow-hidden rounded-xl bg-white shadow-lg lg:mb-8">
		<Tabs {tabs} bind:activeTab />

		<!-- 탭 콘텐츠 -->
		<div class="p-6">
			{#if activeTab === 'overview'}
				<!-- 개요 탭 -->
				<div class="space-y-4 sm:space-y-6">
					<!-- 사용자 정보 카드 -->
					{#if user}
						<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm ring-1 ring-blue-100">
							<div class="relative">
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
									<div class="flex-1">
										<h3 class="mb-4 text-lg font-semibold text-gray-900 flex items-center">
											<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 mr-3">
												<i class="fas fa-user text-blue-600"></i>
											</div>
											계정 정보
										</h3>
										<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
											<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
													<i class="fas fa-user text-blue-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">사용자명</p>
													<p class="font-medium text-gray-900">{user.username}</p>
												</div>
											</div>
											<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
													<i class="fas fa-envelope text-green-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">이메일</p>
													<p class="font-medium text-gray-900">{user.email}</p>
												</div>
											</div>
											<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
													<i class="fas fa-id-card text-purple-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">이름</p>
													<p class="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
												</div>
											</div>
											<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
													<i class="fas fa-shield-alt text-red-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">역할</p>
													<div class="flex items-center space-x-2">
														{#if user.permissions !== undefined}
															<Badge variant="info" size="sm" class="font-medium">
																{PermissionUtils.getRoleName(Number(user.permissions))}
															</Badge>
														{:else}
															<Badge variant="secondary" size="sm" class="font-medium">권한 없음</Badge>
														{/if}
													</div>
												</div>
											</div>
											<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
													<i class="fas fa-user-tag text-orange-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium text-gray-500 uppercase tracking-wide">유형</p>
													<Badge variant={user.userType === USER_TYPES.DEVELOPER ? 'success' : 'info'} size="sm" class="font-medium">
														{user.userType === USER_TYPES.DEVELOPER ? '개발자' : '사용자'}
													</Badge>
												</div>
											</div>
										</div>
									</div>
									<div class="flex justify-center sm:justify-end mt-4 sm:mt-0">
										<Button variant="outline" onclick={navigateToProfile} class="w-full sm:w-auto hover:bg-blue-50 hover:border-blue-200 transition-colors">
											<i class="fas fa-edit mr-2"></i>
											프로필 편집
										</Button>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'analytics'}
				<!-- 분석 탭 -->
				<div class="space-y-6">
					<!-- 로딩 상태 -->
					{#if isDashboardLoading}
						<div class="flex items-center justify-center py-12">
							<div class="text-center">
								<div
									class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"
								></div>
								<p class="text-gray-600">통계 데이터를 불러오는 중...</p>
							</div>
						</div>
					{:else}
						<!-- 인사이트 카드 -->
						<Card class="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
							<div class="flex items-start space-x-4">
								<div class="flex-shrink-0">
									<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
										<i class="fas fa-lightbulb text-xl text-blue-600"></i>
									</div>
								</div>
								<div class="flex-1">
									<h3 class="mb-3 text-lg font-semibold text-gray-900">인사이트 분석</h3>
									<div class="grid gap-4 md:grid-cols-3">
										{#if dashboardStats.insights.trends}
											<div
												class="flex items-start space-x-3 rounded-lg border border-blue-200 bg-white p-3"
											>
												<div
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
												>
													<i class="fas fa-chart-line text-blue-600"></i>
												</div>
												<div class="min-w-0">
													<p class="text-sm font-medium text-gray-900">트렌드 분석</p>
													<p class="mt-1 text-sm text-gray-600">{dashboardStats.insights.trends}</p>
												</div>
											</div>
										{/if}
										{#if dashboardStats.insights.recommendations}
											<div
												class="flex items-start space-x-3 rounded-lg border border-green-200 bg-white p-3"
											>
												<div
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
												>
													<i class="fas fa-check-circle text-green-600"></i>
												</div>
												<div class="min-w-0">
													<p class="text-sm font-medium text-gray-900">권장사항</p>
													<p class="mt-1 text-sm text-gray-600">
														{dashboardStats.insights.recommendations}
													</p>
												</div>
											</div>
										{/if}
										{#if dashboardStats.insights.alerts}
											<div
												class="flex items-start space-x-3 rounded-lg border border-red-200 bg-white p-3"
											>
												<div
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100"
												>
													<i class="fas fa-exclamation-triangle text-red-600"></i>
												</div>
												<div class="min-w-0">
													<p class="text-sm font-medium text-gray-900">주의사항</p>
													<p class="mt-1 text-sm text-gray-600">{dashboardStats.insights.alerts}</p>
												</div>
											</div>
										{/if}
									</div>
									{#if !dashboardStats.insights.trends && !dashboardStats.insights.recommendations && !dashboardStats.insights.alerts}
										<div class="py-8 text-center text-gray-500">
											<i class="fas fa-info-circle mb-2 text-3xl"></i>
											<p>분석할 데이터가 충분하지 않습니다.</p>
											<p class="mt-1 text-sm">더 많은 활동 후 다시 확인해주세요.</p>
										</div>
									{/if}
								</div>
							</div>
						</Card>

						<!-- 메인 차트 그리드 -->
						<div class="grid gap-6 lg:grid-cols-2">
							<!-- 시간별 토큰 발급 차트 -->
							<Card class="transition-shadow duration-300 hover:shadow-lg">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										<i class="fas fa-clock mr-2 text-blue-600"></i>
										24시간 토큰 발급 추이
									</h3>
									<Badge variant="info" size="sm">실시간</Badge>
								</div>
								{#if dashboardStats.tokenIssuanceByHour.some((h) => h.count > 0)}
									<div class="h-80">
										<Chart
											type="line"
											data={{
												labels: dashboardStats.tokenIssuanceByHour.map((h) => h.hour),
												datasets: [
													{
														label: '토큰 발급 수',
														data: dashboardStats.tokenIssuanceByHour.map((h) => h.count),
														borderColor: 'rgb(59, 130, 246)',
														backgroundColor: 'rgba(59, 130, 246, 0.1)',
														tension: 0.4,
														fill: true,
														pointBackgroundColor: 'rgb(59, 130, 246)',
														pointBorderColor: '#ffffff',
														pointBorderWidth: 2,
														pointRadius: 4,
														pointHoverRadius: 6
													}
												]
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												scales: {
													y: {
														beginAtZero: true,
														ticks: {
															stepSize: 1,
															font: {
																size: 12
															}
														},
														grid: {
															color: 'rgba(0, 0, 0, 0.1)'
														}
													},
													x: {
														ticks: {
															font: {
																size: 11
															}
														},
														grid: {
															display: false
														}
													}
												},
												plugins: {
													legend: {
														display: false
													},
													tooltip: {
														backgroundColor: 'rgba(0, 0, 0, 0.8)',
														titleColor: '#ffffff',
														bodyColor: '#ffffff',
														cornerRadius: 8,
														displayColors: false
													}
												},
												interaction: {
													intersect: false,
													mode: 'index'
												},
												animation: {
													duration: 1000,
													easing: 'easeInOutQuart'
												}
											}}
										/>
									</div>
								{:else}
									<div
										class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
									>
										<div class="text-center">
											<i class="fas fa-chart-line mb-3 text-4xl opacity-50"></i>
											<p class="font-medium">최근 24시간 동안</p>
											<p class="text-sm">토큰 발급 기록이 없습니다</p>
										</div>
									</div>
								{/if}
							</Card>

							<!-- 일별 토큰 발급 차트 -->
							<Card class="transition-shadow duration-300 hover:shadow-lg">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										<i class="fas fa-calendar mr-2 text-green-600"></i>
										30일 토큰 발급 추이
									</h3>
									<Badge variant="success" size="sm">
										{dashboardStats.tokenIssuanceByDay.filter((d) => d.count > 0).length}일 활동
									</Badge>
								</div>
								{#if dashboardStats.tokenIssuanceByDay.some((d) => d.count > 0)}
									<div class="h-80">
										<Chart
											type="bar"
											data={{
												labels: dashboardStats.tokenIssuanceByDay.map((d) => {
													const date = new Date(d.date);
													return date.toLocaleDateString('ko-KR', {
														month: 'short',
														day: 'numeric'
													});
												}),
												datasets: [
													{
														label: '토큰 발급 수',
														data: dashboardStats.tokenIssuanceByDay.map((d) => d.count),
														backgroundColor: dashboardStats.tokenIssuanceByDay.map((d) =>
															d.count > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(156, 163, 175, 0.3)'
														),
														borderColor: dashboardStats.tokenIssuanceByDay.map((d) =>
															d.count > 0 ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)'
														),
														borderWidth: 1,
														borderRadius: 4,
														borderSkipped: false
													}
												]
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												scales: {
													y: {
														beginAtZero: true,
														ticks: {
															stepSize: 1,
															font: {
																size: 12
															}
														},
														grid: {
															color: 'rgba(0, 0, 0, 0.1)'
														}
													},
													x: {
														ticks: {
															font: {
																size: 10
															},
															maxRotation: 45
														},
														grid: {
															display: false
														}
													}
												},
												plugins: {
													legend: {
														display: false
													},
													tooltip: {
														backgroundColor: 'rgba(0, 0, 0, 0.8)',
														titleColor: '#ffffff',
														bodyColor: '#ffffff',
														cornerRadius: 8,
														displayColors: false,
														callbacks: {
															title: function (context) {
																const date = new Date(
																	dashboardStats.tokenIssuanceByDay[context[0].dataIndex].date
																);
																return date.toLocaleDateString('ko-KR', {
																	year: 'numeric',
																	month: 'long',
																	day: 'numeric',
																	weekday: 'long'
																});
															}
														}
													}
												},
												animation: {
													duration: 1200,
													easing: 'easeOutBounce'
												}
											}}
										/>
									</div>
								{:else}
									<div
										class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
									>
										<div class="text-center">
											<i class="fas fa-chart-bar mb-3 text-4xl opacity-50"></i>
											<p class="font-medium">최근 30일 동안</p>
											<p class="text-sm">토큰 발급 기록이 없습니다</p>
										</div>
									</div>
								{/if}
							</Card>

							<!-- 클라이언트별 사용량 차트 -->
							<Card class="transition-shadow duration-300 hover:shadow-lg">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										<i class="fas fa-users mr-2 text-purple-600"></i>
										클라이언트별 토큰 사용량
									</h3>
									<Badge variant="secondary" size="sm">
										{dashboardStats.clientUsageStats.length}개 클라이언트
									</Badge>
								</div>
								{#if dashboardStats.clientUsageStats.length > 0}
									<div class="h-80">
										<Chart
											type="doughnut"
											data={{
												labels: dashboardStats.clientUsageStats.map((c) => c.clientName),
												datasets: [
													{
														data: dashboardStats.clientUsageStats.map((c) => c.tokenCount),
														backgroundColor: [
															'rgba(59, 130, 246, 0.9)',
															'rgba(34, 197, 94, 0.9)',
															'rgba(168, 85, 247, 0.9)',
															'rgba(251, 191, 36, 0.9)',
															'rgba(239, 68, 68, 0.9)',
															'rgba(6, 182, 212, 0.9)',
															'rgba(236, 72, 153, 0.9)',
															'rgba(139, 69, 19, 0.9)',
															'rgba(107, 114, 128, 0.9)',
															'rgba(5, 150, 105, 0.9)'
														],
														borderWidth: 3,
														borderColor: '#ffffff',
														hoverBorderWidth: 4,
														hoverBorderColor: '#ffffff',
														hoverOffset: 8
													}
												]
											}}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												plugins: {
													legend: {
														position: 'bottom',
														labels: {
															boxWidth: 12,
															padding: 20,
															font: {
																size: 11
															},
															usePointStyle: true
														}
													},
													tooltip: {
														backgroundColor: 'rgba(0, 0, 0, 0.8)',
														titleColor: '#ffffff',
														bodyColor: '#ffffff',
														cornerRadius: 8,
														callbacks: {
															label: function (context) {
																const label = context.label || '';
																const value = context.parsed;
																const percentage =
																	dashboardStats.clientUsageStats[context.dataIndex].percentage;
																return `${label}: ${value}회 (${percentage.toFixed(1)}%)`;
															}
														}
													}
												},
												animation: {
													duration: 1500,
													easing: 'easeInOutQuart'
												}
											}}
										/>
									</div>
								{:else}
									<div
										class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
									>
										<div class="text-center">
											<i class="fas fa-chart-pie mb-3 text-4xl opacity-50"></i>
											<p class="font-medium">등록된 클라이언트가</p>
											<p class="text-sm">없거나 토큰 발급 기록이 없습니다</p>
										</div>
									</div>
								{/if}
							</Card>

							<!-- 스코프별 사용량 차트 -->
							<Card class="transition-shadow duration-300 hover:shadow-lg">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										<i class="fas fa-shield-alt mr-2 text-orange-600"></i>
										스코프별 사용 통계
									</h3>
									<Badge variant="warning" size="sm">
										{dashboardStats.scopeUsageStats.length}개 스코프
									</Badge>
								</div>
								{#if dashboardStats.scopeUsageStats.length > 0}
									<div class="h-80 space-y-4 overflow-y-auto">
										{#each dashboardStats.scopeUsageStats as scope, index (scope.scope)}
											<div
												class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
											>
												<div
													class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
													style="background-color: {[
														'rgba(59, 130, 246, 0.9)',
														'rgba(168, 85, 247, 0.9)',
														'rgba(34, 197, 94, 0.9)',
														'rgba(251, 191, 36, 0.9)',
														'rgba(239, 68, 68, 0.9)',
														'rgba(6, 182, 212, 0.9)',
														'rgba(236, 72, 153, 0.9)',
														'rgba(139, 69, 19, 0.9)',
														'rgba(107, 114, 128, 0.9)',
														'rgba(5, 150, 105, 0.9)'
													][index % 10]}; color: white;"
												>
													{index + 1}
												</div>
												<div class="min-w-0 flex-1">
													<div class="mb-1 flex items-center justify-between">
														<span class="truncate font-medium text-gray-900">{scope.scope}</span>
														<div class="flex items-center space-x-2">
															<Badge variant="secondary" size="sm">{scope.count}회</Badge>
															<span class="text-sm font-medium text-gray-600"
																>{scope.percentage}%</span
															>
														</div>
													</div>
													<div class="h-3 w-full rounded-full bg-gray-200">
														<div
															class="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 ease-out"
															style="width: {scope.percentage}%"
														></div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div
										class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
									>
										<div class="text-center">
											<i class="fas fa-shield-alt mb-3 text-4xl opacity-50"></i>
											<p class="font-medium">사용된 스코프가</p>
											<p class="text-sm">없거나 토큰 발급 기록이 없습니다</p>
										</div>
									</div>
								{/if}
							</Card>
						</div>

						<!-- 통계 요약 카드들 -->
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<Card
								class="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-center transition-shadow hover:shadow-md"
							>
								<div class="p-4">
									<div class="mb-3 flex items-center justify-center">
										<i class="fas fa-key text-3xl text-blue-600"></i>
									</div>
									<p class="mb-1 text-3xl font-bold text-blue-900">
										{dashboardStats.totalTokensIssued.toLocaleString()}
									</p>
									<p class="text-sm font-medium text-blue-700">총 토큰 발급</p>
									<p class="mt-1 text-xs text-blue-600">누적 발급량</p>
								</div>
							</Card>

							<Card
								class="border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-center transition-shadow hover:shadow-md"
							>
								<div class="p-4">
									<div class="mb-3 flex items-center justify-center">
										<i class="fas fa-clock text-3xl text-red-600"></i>
									</div>
									<p class="mb-1 text-3xl font-bold text-red-900">
										{dashboardStats.expiredTokens.toLocaleString()}
									</p>
									<p class="text-sm font-medium text-red-700">만료된 토큰</p>
									<p class="mt-1 text-xs text-red-600">
										{dashboardStats.tokenExpirationRate.toFixed(1)}% 만료율
									</p>
								</div>
							</Card>

							<Card
								class="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 text-center transition-shadow hover:shadow-md"
							>
								<div class="p-4">
									<div class="mb-3 flex items-center justify-center">
										<i class="fas fa-ban text-3xl text-orange-600"></i>
									</div>
									<p class="mb-1 text-3xl font-bold text-orange-900">
										{dashboardStats.revokedTokens.toLocaleString()}
									</p>
									<p class="text-sm font-medium text-orange-700">취소된 토큰</p>
									<p class="mt-1 text-xs text-orange-600">보안 조치</p>
								</div>
							</Card>

							<Card
								class="border-green-200 bg-gradient-to-br from-green-50 to-green-100 text-center transition-shadow hover:shadow-md"
							>
								<div class="p-4">
									<div class="mb-3 flex items-center justify-center">
										<i class="fas fa-percentage text-3xl text-green-600"></i>
									</div>
									<p class="mb-1 text-3xl font-bold text-green-900">
										{dashboardStats.tokenExpirationRate.toFixed(1)}%
									</p>
									<p class="text-sm font-medium text-green-700">만료율</p>
									<p class="mt-1 text-xs text-green-600">전체 대비</p>
								</div>
							</Card>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'activity'}
				<!-- 최근 활동 탭 -->
				<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm ring-1 ring-green-100">
					<div class="relative">
						<h3 class="mb-6 text-lg font-semibold text-gray-900 flex items-center">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 mr-3">
								<i class="fas fa-history text-green-600"></i>
							</div>
							최근 활동
						</h3>
						<div class="space-y-4">
							{#each recentActivities as activity, index (activity.id || activity.createdAt || `activity-${index}`)}
								{@const { icon, color } = getActivityIcon(activity.type)}
								<div class="group flex items-start space-x-4 rounded-lg bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:shadow-sm">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br {color} group-hover:scale-110 transition-transform flex-shrink-0">
										<i class="{icon} text-white"></i>
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<p class="mb-1 text-sm font-medium text-gray-900">{activity.description}</p>
												{#if activity.metadata?.activity}
													<p class="mb-2 text-xs text-gray-600">{activity.metadata.activity}</p>
												{/if}

												<!-- 추가 세부 정보 표시 -->
												{#if activity.metadata?.details}
													<div class="space-y-1">
														{#if activity.metadata.details.scopes && Array.isArray(activity.metadata.details.scopes)}
															<div class="flex flex-wrap gap-1">
																{#each activity.metadata.details.scopes as scope, scopeIndex (`${scope}-${scopeIndex}`)}
																	<Badge variant="secondary" class="px-2 py-0.5 text-xs">
																		{scope}
																	</Badge>
																{/each}
															</div>
														{/if}

														{#if activity.metadata.details.expiresAt}
															<p class="text-xs text-gray-500">
																<i class="fas fa-clock mr-1"></i>
																만료: {new Date(activity.metadata.details.expiresAt).toLocaleString(
																	'ko-KR'
																)}
															</p>
														{/if}

														{#if activity.metadata.details.isActive !== undefined}
															<p class="text-xs text-gray-500">
																<i class="fas fa-info-circle mr-1"></i>
																상태: {activity.metadata.details.isActive ? '활성' : '비활성'}
																{#if activity.metadata.details.isConfidential !== undefined}
																	• 기밀: {activity.metadata.details.isConfidential ? '예' : '아니오'}
																{/if}
															</p>
														{/if}

														{#if activity.metadata.details.description}
															<p class="mt-1 text-xs text-gray-500 italic">
																"{activity.metadata.details.description}"
															</p>
														{/if}
													</div>
												{/if}

												{#if activity.metadata?.reason}
													<p class="mt-1 text-xs text-red-600">
														<i class="fas fa-exclamation-triangle mr-1"></i>
														사유: {activity.metadata.reason}
													</p>
												{/if}
											</div>
											<div class="ml-3 flex-shrink-0 text-right">
												<p class="text-xs text-gray-500">{getRelativeTime(activity.createdAt)}</p>
											</div>
										</div>
									</div>
								</div>
							{/each}
							{#if recentActivities.length === 0}
								<div class="flex flex-col items-center justify-center py-12 text-center">
									<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
										<i class="fas fa-inbox text-gray-400 text-2xl"></i>
									</div>
									<h4 class="text-sm font-medium text-gray-900 mb-1">최근 활동이 없습니다</h4>
									<p class="text-sm text-gray-500">활동 내역이 여기에 표시됩니다.</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{:else if activeTab === 'quick-actions'}
				<!-- 빠른 작업 탭 -->
				<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm ring-1 ring-purple-100">
					<div class="relative">
						<div class="text-center sm:text-left mb-6">
							<h3 class="mb-2 text-lg font-semibold text-gray-900 flex items-center justify-center sm:justify-start">
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 mr-3">
									<i class="fas fa-bolt text-purple-600"></i>
								</div>
								빠른 작업
							</h3>
							<p class="text-sm text-gray-600">자주 사용하는 기능을 빠르게 실행하세요</p>
						</div>
						{#if userTypeConfig}
							<div class="grid gap-4 {getGridColsClass(userTypeConfig.quickActions.length, 'actions')}">
								{#each userTypeConfig.quickActions as action, actionIndex (action.label || `action-${actionIndex}`)}
									{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
									<div class="group relative overflow-hidden rounded-xl bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-lg hover:scale-105 border border-gray-100">
										<Button
											variant="ghost"
											class="w-full h-full flex flex-col items-center justify-center space-y-3 p-0 hover:bg-transparent"
											onclick={action.action}
										>
											<div class="relative">
												<div class="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 {colorClass?.background || 'bg-gray-100'} group-hover:scale-110 group-hover:shadow-lg">
													<i class="text-xl {colorClass?.text || 'text-gray-600'} {action.icon}"></i>
												</div>
												<div class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
											</div>
											<span class="text-center text-sm leading-tight font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
												{action.label}
											</span>
										</Button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</DashboardLayout>
