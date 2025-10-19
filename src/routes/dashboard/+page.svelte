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
		PermissionUtils,
		DashboardSkeleton
	} from '$lib';
	import Chart from '$lib/components/Chart.svelte';
	import StatsCards from '$lib/components/dashboard/StatsCards.svelte';
	import RecentActivities from '$lib/components/dashboard/RecentActivities.svelte';
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
	{#if isDashboardLoading}
		<DashboardSkeleton type="stats" />
	{:else if userTypeConfig}
		<StatsCards {dashboardStats} {user} {isDeveloper} roleName={$roleName} />
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
					{#if isDashboardLoading}
						<!-- 사용자 정보 카드 스켈레톤 -->
						<div
							class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm ring-1 ring-blue-100"
						>
							<div class="relative">
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex-1">
										<div class="mb-4 flex items-center text-lg font-semibold">
											<div class="mr-3 h-8 w-8 animate-pulse rounded-lg bg-blue-200"></div>
											<div class="h-6 w-24 animate-pulse rounded bg-blue-200"></div>
										</div>
										<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
											{#each Array(5) as _, i (i)}
												<div
													class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm"
												>
													<div class="h-8 w-8 animate-pulse rounded-lg bg-blue-200"></div>
													<div>
														<div class="mb-1 h-3 w-16 animate-pulse rounded bg-blue-200"></div>
														<div class="h-4 w-20 animate-pulse rounded bg-blue-100"></div>
													</div>
												</div>
											{/each}
										</div>
									</div>
									<div class="mt-4 flex justify-center sm:mt-0 sm:justify-end">
										<div class="h-10 w-24 animate-pulse rounded bg-blue-200"></div>
									</div>
								</div>
							</div>
						</div>
					{:else if user}
						<div
							class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm ring-1 ring-blue-100"
						>
							<div class="relative">
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex-1">
										<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
											<div
												class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"
											>
												<i class="fas fa-user text-blue-600"></i>
											</div>
											계정 정보
										</h3>
										<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
											<div
												class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm"
											>
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100"
												>
													<i class="fas fa-user text-blue-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
														사용자명
													</p>
													<p class="font-medium text-gray-900">{user.username}</p>
												</div>
											</div>
											<div
												class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm"
											>
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100"
												>
													<i class="fas fa-envelope text-green-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
														이메일
													</p>
													<p class="font-medium text-gray-900">{user.email}</p>
												</div>
											</div>
											<div
												class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1"
											>
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100"
												>
													<i class="fas fa-id-card text-purple-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
														이름
													</p>
													<p class="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
												</div>
											</div>
											<div
												class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm"
											>
												<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
													<i class="fas fa-shield-alt text-red-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
														역할
													</p>
													<div class="flex items-center space-x-2">
														{#if user.permissions !== undefined}
															<Badge variant="info" size="sm" class="font-medium">
																{PermissionUtils.getRoleName(Number(user.permissions))}
															</Badge>
														{:else}
															<Badge variant="secondary" size="sm" class="font-medium"
																>권한 없음</Badge
															>
														{/if}
													</div>
												</div>
											</div>
											<div
												class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm"
											>
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100"
												>
													<i class="fas fa-user-tag text-orange-600"></i>
												</div>
												<div>
													<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
														유형
													</p>
													<Badge
														variant={user.userType === USER_TYPES.DEVELOPER ? 'success' : 'info'}
														size="sm"
														class="font-medium"
													>
														{user.userType === USER_TYPES.DEVELOPER ? '개발자' : '사용자'}
													</Badge>
												</div>
											</div>
										</div>
									</div>
									<div class="mt-4 flex justify-center sm:mt-0 sm:justify-end">
										<Button
											variant="outline"
											onclick={navigateToProfile}
											class="w-full transition-colors hover:border-blue-200 hover:bg-blue-50 sm:w-auto"
										>
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
						<div class="space-y-6">
							<DashboardSkeleton type="insights" />
							<div class="grid gap-6 lg:grid-cols-2">
								<DashboardSkeleton type="chart" />
								<DashboardSkeleton type="chart" />
								<DashboardSkeleton type="chart" />
								<DashboardSkeleton type="chart" />
							</div>
							<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{#each Array(4) as _, i (i)}
									<div
										class="overflow-hidden rounded-xl border-gray-200 bg-gradient-to-br from-gray-200 to-gray-300 p-4 text-center shadow-lg"
									>
										<div class="mb-3 flex items-center justify-center">
											<div class="h-8 w-8 animate-pulse rounded bg-white/40"></div>
										</div>
										<div class="mx-auto mb-1 h-8 w-16 animate-pulse rounded bg-white/40"></div>
										<div class="mx-auto mb-1 h-4 w-20 animate-pulse rounded bg-white/40"></div>
										<div class="mx-auto h-3 w-12 animate-pulse rounded bg-white/40"></div>
									</div>
								{/each}
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
				{#if isDashboardLoading}
					<DashboardSkeleton type="activity" count={5} />
				{:else}
					<RecentActivities activities={recentActivities} isLoading={isDashboardLoading} />
				{/if}
			{:else if activeTab === 'quick-actions'}
				<!-- 빠른 작업 탭 -->
				<div
					class="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm ring-1 ring-purple-100"
				>
					<div class="relative">
						<div class="mb-6 text-center sm:text-left">
							<h3
								class="mb-2 flex items-center justify-center text-lg font-semibold text-gray-900 sm:justify-start"
							>
								<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
									<i class="fas fa-bolt text-purple-600"></i>
								</div>
								빠른 작업
							</h3>
							<p class="text-sm text-gray-600">자주 사용하는 기능을 빠르게 실행하세요</p>
						</div>
						{#if userTypeConfig}
							<div
								class="grid gap-4 {getGridColsClass(userTypeConfig.quickActions.length, 'actions')}"
							>
								{#each userTypeConfig.quickActions as action, actionIndex (action.label || `action-${actionIndex}`)}
									{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
									<div
										class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:shadow-lg"
									>
										<Button
											variant="ghost"
											class="flex h-full w-full flex-col items-center justify-center space-y-3 p-0 hover:bg-transparent"
											onclick={action.action}
										>
											<div class="relative">
												<div
													class="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 {colorClass?.background ||
														'bg-gray-100'} group-hover:scale-110 group-hover:shadow-lg"
												>
													<i class="text-xl {colorClass?.text || 'text-gray-600'} {action.icon}"
													></i>
												</div>
												<div
													class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100"
												></div>
											</div>
											<span
												class="text-center text-sm leading-tight font-medium text-gray-700 transition-colors group-hover:text-gray-900"
											>
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
