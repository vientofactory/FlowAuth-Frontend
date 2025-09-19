<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, Tabs, apiClient, authState, useToast } from '$lib';
	import { PermissionUtils } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
	import { USER_TYPES } from '$lib/types/user.types';

	let user = $state<User | null>(null);
	let _isLoading = $state(true);

	let dashboardStats = $state({
		totalClients: 0,
		activeTokens: 0,
		lastLoginDate: null as string | null,
		accountCreated: null as string | null
	});

	// 사용자 유형별 대시보드 설정
	const userTypeConfig = $derived.by(() => {
		if (!user) return null;

		const isDeveloper = user.userType === USER_TYPES.DEVELOPER;

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
			].filter(stat => stat.show),
			quickActions: isDeveloper ? [
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
					label: '시스템\n설정',
					icon: 'fas fa-cog',
					color: 'purple',
					action: navigateToSettings
				},
				{
					label: 'OAuth2\n테스터',
					icon: 'fas fa-link',
					color: 'orange',
					action: navigateToOAuthTester
				}
			] : [
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
				},
				{
					label: '계정\n설정',
					icon: 'fas fa-cog',
					color: 'purple',
					action: navigateToSettings
				},
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
			createdAt: string;
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
	function getRelativeTime(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
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
		{ id: 'activity', label: '최근 활동', icon: 'fas fa-clock' },
		{ id: 'quick-actions', label: '빠른 작업', icon: 'fas fa-bolt' }
	];

	let activeTab = $state('overview');

	onMount(() => {
		// store 구독
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			_isLoading = state.isLoading;

			// user가 로드되면 accountCreated 업데이트
			if (user?.createdAt && dashboardStats.accountCreated !== user.createdAt) {
				dashboardStats.accountCreated = user.createdAt;
			}
		});

		// 대시보드 통계 로드
		loadDashboardData().catch(console.error);

		return unsubscribe;
	});
	async function loadDashboardData() {
		try {
			// 실제 API 호출로 대시보드 통계 가져오기
			const [stats, activities] = await Promise.all([
				apiClient.getDashboardStats(),
				apiClient.getRecentActivities(5),
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
				lastLoginDate: null,
				accountCreated: user?.createdAt || null
			};
			toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
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
				case 1: return 'grid-cols-1';
				case 2: return 'grid-cols-1 sm:grid-cols-2';
				case 3: return 'grid-cols-2 sm:grid-cols-3';
				default: return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
			}
		} else {
			switch (count) {
				case 1: return 'grid-cols-1';
				case 2: return 'grid-cols-1 sm:grid-cols-2';
				case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
				default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
			}
		}
	}

	// 통계 라벨 표시 함수
	function getStatBadgeText(label: string): string {
		switch (label) {
			case '클라이언트': return '총계';
			case '토큰': return '활성';
			case '로그인': return '최근';
			case '계정': return '생성';
			default: return '';
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

<DashboardLayout title={userTypeConfig?.title || '대시보드'} description={userTypeConfig?.description || 'OAuth2 인증 시스템을 관리하고 모니터링하세요.'}>
	<!-- 통계 카드들 -->
	{#if userTypeConfig}
		<div class="mb-6 grid gap-4 {getGridColsClass(userTypeConfig.stats.length, 'stats')}">
			{#each userTypeConfig.stats as stat}
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
		<Tabs {tabs} bind:activeTab>
			{#snippet children({ activeTab })}
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
										<div
											class="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 sm:gap-4"
										>
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
															{PermissionUtils.getRoleName(parseInt(user.permissions, 10))}
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
													<Badge variant={user.userType === USER_TYPES.DEVELOPER ? 'success' : 'primary'} size="sm" class="ml-1">
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

						<!-- 시스템 상태 -->
						<Card>
							<h3 class="mb-4 text-lg font-semibold text-gray-900">시스템 상태</h3>
							{#if user?.userType === USER_TYPES.DEVELOPER}
								<!-- 개발자용 상세 시스템 상태 -->
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<i class="fas fa-check text-green-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">API 서버</p>
											<p class="text-sm text-gray-600">정상 작동 중</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<i class="fas fa-check text-green-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">데이터베이스</p>
											<p class="text-sm text-gray-600">연결됨</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<i class="fas fa-check text-green-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">OAuth2 서비스</p>
											<p class="text-sm text-gray-600">활성</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
											<i class="fas fa-info-circle text-blue-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">활성 클라이언트</p>
											<p class="text-sm text-gray-600">{dashboardStats.totalClients}개</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
											<i class="fas fa-key text-purple-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">활성 토큰</p>
											<p class="text-sm text-gray-600">{dashboardStats.activeTokens}개</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
											<i class="fas fa-clock text-orange-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">마지막 업데이트</p>
											<p class="text-sm text-gray-600">실시간</p>
										</div>
									</div>
								</div>
							{:else}
								<!-- 일반 사용자용 간단한 시스템 상태 -->
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<i class="fas fa-check text-green-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">서비스 상태</p>
											<p class="text-sm text-gray-600">정상 작동 중</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<i class="fas fa-shield-alt text-green-600"></i>
										</div>
										<div>
											<p class="font-medium text-gray-900">보안 상태</p>
											<p class="text-sm text-gray-600">안전함</p>
										</div>
									</div>
								</div>
							{/if}
						</Card>
					</div>
				{:else if activeTab === 'activity'}
					<!-- 최근 활동 탭 -->
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">최근 활동</h3>
						<div class="space-y-3">
							{#each recentActivities as activity}
								{@const { icon, color } = getActivityIcon(activity.type)}
								<div class="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
									<div class="flex h-10 w-10 items-center justify-center rounded-full {color} flex-shrink-0">
										<i class="{icon}"></i>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900 mb-1">{activity.description}</p>
												{#if activity.metadata?.activity}
													<p class="text-xs text-gray-600 mb-2">{activity.metadata.activity}</p>
												{/if}

												<!-- 추가 세부 정보 표시 -->
												{#if activity.metadata?.details}
													<div class="space-y-1">
														{#if activity.metadata.details.scopes && Array.isArray(activity.metadata.details.scopes)}
															<div class="flex flex-wrap gap-1">
																{#each activity.metadata.details.scopes as scope}
																	<Badge variant="secondary" class="text-xs px-2 py-0.5">
																		{scope}
																	</Badge>
																{/each}
															</div>
														{/if}

														{#if activity.metadata.details.expiresAt}
															<p class="text-xs text-gray-500">
																<i class="fas fa-clock mr-1"></i>
																만료: {new Date(activity.metadata.details.expiresAt).toLocaleString('ko-KR')}
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
															<p class="text-xs text-gray-500 mt-1 italic">
																"{activity.metadata.details.description}"
															</p>
														{/if}
													</div>
												{/if}

												{#if activity.metadata?.reason}
													<p class="text-xs text-red-600 mt-1">
														<i class="fas fa-exclamation-triangle mr-1"></i>
														사유: {activity.metadata.reason}
													</p>
												{/if}
											</div>
											<div class="text-right flex-shrink-0 ml-3">
												<p class="text-xs text-gray-500">{getRelativeTime(activity.createdAt)}</p>
											</div>
										</div>
									</div>
								</div>
							{/each}
							{#if recentActivities.length === 0}
								<div class="text-center py-8 text-gray-500">
									<i class="fas fa-clock text-3xl mb-2"></i>
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
							<div class="grid gap-4 {getGridColsClass(userTypeConfig.quickActions.length, 'actions')}">
								{#each userTypeConfig.quickActions as action}
									{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
									<Button
										variant="outline"
										class="group flex h-24 flex-col items-center justify-center space-y-1 border-dashed border-gray-300 px-2 py-2 transition-all duration-200 hover:scale-105 {colorClass?.hover || ''} sm:h-28 sm:px-3 sm:py-3"
										onclick={action.action}
									>
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 {colorClass?.background || ''} sm:h-10 sm:w-10"
										>
											<i class="text-lg {colorClass?.text || ''} sm:text-xl {action.icon}"></i>
										</div>
										<span class="text-center text-xs leading-none font-medium sm:text-sm">
											{@html action.label.replace('\n', '<br />')}
										</span>
									</Button>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/snippet}
		</Tabs>
	</Card>
</DashboardLayout>
