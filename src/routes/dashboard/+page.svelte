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
		PERMISSIONS
	} from '$lib';
	import Chart from '$lib/components/Chart.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
	import { USER_TYPES } from '$lib/types/user.types';

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

	// 사용자 유형별 대시보드 설정
	const userTypeConfig = $derived.by(() => {
		if (!user) return null;

		const isDeveloper = user.userType === USER_TYPES.DEVELOPER;
		const hasManageSystemPermission =
			user.permissions !== undefined &&
			PermissionUtils.hasPermission(Number(user.permissions), PERMISSIONS.MANAGE_SYSTEM);

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
				}
			].filter((stat) => stat.show),
			quickActions: [
				// 개발자용 작업들
				...(isDeveloper
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
							// 일반 사용자용 작업들
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
						]),
				// 시스템 관리 권한이 있는 경우 시스템 설정 버튼 추가
				...(hasManageSystemPermission
					? [
							{
								label: '시스템\n설정',
								icon: 'fas fa-cog',
								color: 'purple',
								action: navigateToSettings
							}
						]
					: []),
				// 도움말 버튼 (항상 표시)
				{
					label: '도움말',
					icon: 'fas fa-question-circle',
					color: 'orange',
					action: () => goto('/help')
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

			// authState 로딩이 끝나고 user가 있고 아직 대시보드 데이터를 로드하지 않은 경우에만 로드
			if (!state.isLoading && user && !isDashboardLoading && !isDashboardDataLoaded) {
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

	function navigateToSettings() {
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
	{#if userTypeConfig && !isDashboardLoading}
		<div class="mb-6 grid gap-4 {getGridColsClass(userTypeConfig.stats.length, 'stats')}">
			{#each userTypeConfig.stats as stat, index (stat.label || `stat-${index}`)}
				<Card
					class="group relative overflow-hidden bg-gradient-to-br {stat.color} text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
				>
					<div class="relative p-4 sm:p-6">
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<div class="mb-2 flex items-center justify-between">
									<i class="{stat.icon} text-2xl opacity-80 sm:text-3xl"></i>
									<span class="text-xs opacity-70">{getStatBadgeText(stat.label)}</span>
								</div>
								<p class="mb-1 text-sm font-medium opacity-80">{stat.label}</p>
								<p class="text-xl font-bold sm:text-2xl">{stat.value}</p>
							</div>
						</div>
						<div class="absolute -right-4 -bottom-4 opacity-10">
							<i class="{stat.icon} text-6xl sm:text-8xl"></i>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- 탭 인터페이스 -->
	<Card class="mb-6 lg:mb-8">
		<Tabs {tabs} bind:activeTab />

		<!-- 탭 콘텐츠 -->
		<div class="mt-6">
			{#if activeTab === 'overview'}
				<!-- 개요 탭 -->
				<div class="space-y-4 sm:space-y-6">
					<!-- 사용자 정보 카드 -->
					{#if user}
						<Card class="border-l-4 border-l-blue-500">
							<div
								class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
							>
								<div class="flex-1">
									<h3 class="mb-3 text-base font-semibold text-gray-900 sm:mb-0 sm:text-lg">
										계정 정보
									</h3>
									<div class="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 sm:gap-4">
										<div class="flex items-center space-x-2">
											<i class="fas fa-user w-4 text-gray-400"></i>
											<span><span class="font-medium">사용자명:</span> {user.username}</span>
										</div>
										<div class="flex items-center space-x-2">
											<i class="fas fa-envelope w-4 text-gray-400"></i>
											<span><span class="font-medium">이메일:</span> {user.email}</span>
										</div>
										<div class="flex items-center space-x-2 sm:col-span-2">
											<i class="fas fa-id-card w-4 text-gray-400"></i>
											<span>
												<span class="font-medium">이름:</span>
												{user.firstName}
												{user.lastName}
											</span>
										</div>
										<div class="flex items-center space-x-2">
											<i class="fas fa-shield-alt w-4 text-gray-400"></i>
											<span>
												<span class="font-medium">역할:</span>
												{#if user.permissions !== undefined}
													<Badge variant="info" size="sm" class="ml-1">
														{PermissionUtils.getRoleName(Number(user.permissions))}
													</Badge>
												{:else}
													<Badge variant="secondary" size="sm" class="ml-1">권한 없음</Badge>
												{/if}
											</span>
										</div>
										<div class="flex items-center space-x-2">
											<i class="fas fa-user-tag w-4 text-gray-400"></i>
											<span>
												<span class="font-medium">유형:</span>
												<Badge
													variant={user.userType === USER_TYPES.DEVELOPER ? 'success' : 'info'}
													size="sm"
													class="ml-1"
												>
													{user.userType === USER_TYPES.DEVELOPER ? '개발자' : '일반 사용자'}
												</Badge>
											</span>
										</div>
									</div>
								</div>
								<div class="flex justify-center sm:justify-end">
									<Button variant="outline" onclick={navigateToProfile} class="w-full sm:w-auto">
										<i class="fas fa-edit mr-2"></i>
										프로필 편집
									</Button>
								</div>
							</div>
						</Card>
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

						<!-- 토큰 수명 분석 -->
						<Card class="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
							<div class="mb-6 flex items-center justify-between">
								<h3 class="text-xl font-semibold text-gray-900">
									<i class="fas fa-hourglass-half mr-2 text-indigo-600"></i>
									토큰 수명 분석
								</h3>
								<div class="flex items-center space-x-2">
									<Badge
										variant={dashboardStats.averageTokenLifetime >= 168
											? 'success'
											: dashboardStats.averageTokenLifetime >= 24
												? 'warning'
												: 'info'}
										size="sm"
									>
										{dashboardStats.averageTokenLifetime >= 168
											? '장기'
											: dashboardStats.averageTokenLifetime >= 24
												? '중기'
												: '단기'} 수명
									</Badge>
								</div>
							</div>
							<div class="grid gap-6 md:grid-cols-2">
								<div class="rounded-xl border border-indigo-100 bg-white p-6 text-center shadow-sm">
									<div
										class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100"
									>
										<i class="fas fa-stopwatch text-2xl text-indigo-600"></i>
									</div>
									<p class="mb-2 text-4xl font-bold text-indigo-900">
										{dashboardStats.averageTokenLifetime.toFixed(1)}
									</p>
									<p class="text-lg font-medium text-indigo-700">평균 토큰 수명</p>
									<p class="mt-1 text-sm text-indigo-600">시간 단위</p>
								</div>
								<div class="space-y-4">
									<div class="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
										<div class="mb-2 flex items-center justify-between">
											<span class="text-sm font-medium text-gray-700">수명 등급</span>
											<span
												class="text-sm font-bold {dashboardStats.averageTokenLifetime >= 168
													? 'text-green-600'
													: dashboardStats.averageTokenLifetime >= 24
														? 'text-yellow-600'
														: 'text-blue-600'}"
											>
												{dashboardStats.averageTokenLifetime >= 168
													? '장기 (안전)'
													: dashboardStats.averageTokenLifetime >= 24
														? '중기 (보통)'
														: '단기 (매우 안전)'}
											</span>
										</div>
										<div class="h-3 w-full rounded-full bg-gray-200">
											<div
												class="h-3 rounded-full transition-all duration-1000 {dashboardStats.averageTokenLifetime >=
												168
													? 'bg-green-500'
													: dashboardStats.averageTokenLifetime >= 24
														? 'bg-yellow-500'
														: 'bg-blue-500'}"
												style="width: {Math.min(
													(dashboardStats.averageTokenLifetime / 720) * 100,
													100
												)}%"
											></div>
										</div>
										<p class="mt-2 text-xs text-gray-500">
											기준: 30일 = 100%, 1일 = 3.5%, 1시간 = 0.15%
										</p>
									</div>
									<div class="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
										<h4 class="mb-2 font-medium text-gray-900">보안 권장사항</h4>
										<p class="text-sm text-gray-600">
											{#if dashboardStats.averageTokenLifetime >= 168}
												토큰 수명이 깁니다. 보안을 강화하려면 만료 시간을 단축하는 것을 고려하세요.
											{:else if dashboardStats.averageTokenLifetime >= 24}
												토큰 수명이 적절합니다. 현재 설정을 유지하는 것이 좋습니다.
											{:else}
												토큰 수명이 매우 짧습니다. 사용자 경험을 위해 만료 시간을 연장하는 것을
												고려하세요.
											{/if}
										</p>
									</div>
								</div>
							</div>
						</Card>
					{/if}
				</div>
			{:else if activeTab === 'activity'}
				<!-- 최근 활동 탭 -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">최근 활동</h3>
					<div class="space-y-3">
						{#each recentActivities as activity, index (activity.id || activity.createdAt || `activity-${index}`)}
							{@const { icon, color } = getActivityIcon(activity.type)}
							<div
								class="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
							>
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full {color} flex-shrink-0"
								>
									<i class={icon}></i>
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
							<div class="py-8 text-center text-gray-500">
								<i class="fas fa-clock mb-2 text-3xl"></i>
								<p>최근 활동이 없습니다.</p>
							</div>
						{/if}
					</div>
				</div>
			{:else if activeTab === 'quick-actions'}
				<!-- 빠른 작업 탭 -->
				<div class="space-y-4 sm:space-y-6">
					<div class="text-center sm:text-left">
						<h3 class="mb-2 text-lg font-semibold text-gray-900">빠른 작업</h3>
						<p class="text-sm text-gray-600">자주 사용하는 기능을 빠르게 실행하세요</p>
					</div>
					{#if userTypeConfig}
						<div
							class="grid gap-4 {getGridColsClass(userTypeConfig.quickActions.length, 'actions')}"
						>
							{#each userTypeConfig.quickActions as action, actionIndex (action.label || `action-${actionIndex}`)}
								{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
								<Button
									variant="outline"
									class="group flex h-24 flex-col items-center justify-center space-y-1 border-dashed border-gray-300 px-2 py-2 transition-all duration-200 hover:scale-105 {colorClass?.hover ||
										''} sm:h-28 sm:px-3 sm:py-3"
									onclick={action.action}
								>
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 {colorClass?.background ||
											''} sm:h-10 sm:w-10"
									>
										<i class="text-lg {colorClass?.text || ''} sm:text-xl {action.icon}"></i>
									</div>
									<span class="text-center text-xs leading-none font-medium sm:text-sm">
										{action.label}
									</span>
								</Button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</Card>
</DashboardLayout>
