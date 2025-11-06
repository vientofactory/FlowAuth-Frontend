<script lang="ts">
	import { DashboardLayout, Tabs, apiClient, authState, useToast, DashboardSkeleton } from '$lib';
	import StatsCards from '$lib/components/dashboard/StatsCards.svelte';
	import OverviewTab from '$lib/components/dashboard/OverviewTab.svelte';
	import AnalyticsTab from '$lib/components/dashboard/AnalyticsTab.svelte';
	import ActivityTab from '$lib/components/dashboard/ActivityTab.svelte';
	import QuickActionsTab from '$lib/components/dashboard/QuickActionsTab.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
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
		lastLoginDate: undefined as Date | undefined,
		accountCreated: undefined as Date | undefined,
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

	// 새로운 고급 분석 데이터 상태
	let tokenAnalytics = $state({
		usagePatterns: {
			peakHours: [] as Array<{ hour: number; count: number; percentage: number }>,
			weeklyPatterns: [] as Array<{ day: string; count: number; percentage: number }>,
			monthlyTrends: [] as Array<{ month: string; count: number; growth: number }>
		},
		clientPerformance: [] as Array<{
			clientId: number;
			clientName: string;
			totalTokens: number;
			activeTokens: number;
			avgResponseTime: number;
			errorRate: number;
			lastActivity: string;
		}>,
		userActivity: {
			activeUsers: 0,
			newUsers: 0,
			returningUsers: 0,
			sessionDuration: 0,
			geographicDistribution: [] as Array<{ country: string; count: number; percentage: number }>
		}
	});

	let securityMetrics = $state({
		alerts: {
			total: 0,
			critical: 0,
			high: 0,
			medium: 0,
			low: 0,
			byType: [] as Array<{ type: string; count: number; severity: string }>
		},
		riskAnalysis: {
			overallRiskScore: 0,
			riskFactors: [] as Array<{ factor: string; score: number; impact: string }>,
			recommendations: [] as string[]
		},
		threatDetection: {
			suspiciousActivities: 0,
			blockedAttempts: 0,
			geographicThreats: [] as Array<{ country: string; threatLevel: string; incidents: number }>,
			timeBasedPatterns: [] as Array<{ hour: number; threatCount: number }>
		},
		trends: {
			alertTrend: [] as Array<{ date: string; count: number; severity: string }>,
			riskTrend: [] as Array<{ date: string; score: number }>,
			securityScore: 0
		}
	});

	let advancedAnalytics = $state({
		tokenLifecycle: {
			creationToExpiration: [] as Array<{ stage: string; avgTime: number; percentage: number }>,
			revocationReasons: [] as Array<{ reason: string; count: number; percentage: number }>,
			lifetimeDistribution: [] as Array<{ range: string; count: number; percentage: number }>
		},
		clientAnalytics: {
			topClients: [] as Array<{
				clientId: number;
				clientName: string;
				metrics: { [key: string]: number };
			}>,
			clientHealth: [] as Array<{ clientId: number; healthScore: number; issues: string[] }>,
			usageCorrelation: [] as Array<{ clientA: string; clientB: string; correlation: number }>
		},
		predictiveInsights: {
			tokenDemand: { predicted: 0, confidence: 0, trend: '' },
			riskPrediction: { level: '', factors: [] as string[], mitigation: [] as string[] },
			systemCapacity: { current: 0, predicted: 0, bottleneck: '' }
		}
	});

	// 권한 관련 상태
	const {
		canManageSystem,
		isClientManager,
		isTokenManager,
		isUserManager,
		roleName: _roleName
	} = usePermissions();

	// 파생 상태
	const _hasManageSystemPermission = $derived($canManageSystem);
	const isDeveloper = $derived($isClientManager || $isTokenManager || $isUserManager);

	// 사용자 유형별 대시보드 설정
	const userTypeConfig = $derived.by(() => {
		if (!user) return null;

		// 사용자 유형에 따른 역할 이름 결정
		let displayRoleName = '일반 사용자'; // 기본값
		if (user.userType === 'developer') {
			displayRoleName = '개발자';
		} else if (user.userType === 'regular') {
			displayRoleName = '일반 사용자';
		}

		// ADMIN 권한이 있는 경우 시스템 관리자로 표시
		const userPermissions =
			typeof user.permissions === 'string' ? parseInt(user.permissions, 10) : user.permissions;
		if (userPermissions && (userPermissions & 1073741824) === 1073741824) {
			// ADMIN_ACCESS 비트
			displayRoleName = '시스템 관리자';
		}

		return {
			title: user.userType === 'developer' ? '개발자 대시보드' : '사용자 대시보드',
			description:
				user.userType === 'developer'
					? 'OAuth2 클라이언트와 토큰을 관리하고 모니터링하세요.'
					: '계정을 관리하고 OAuth2 로그인을 이용하세요.',
			displayRoleName,
			stats: [
				{
					label: '클라이언트',
					value: dashboardStats.totalClients,
					icon: 'fas fa-users',
					color: 'from-stone-500 to-stone-600',
					show: user.userType === 'developer'
				},
				{
					label: '토큰',
					value: dashboardStats.activeTokens,
					icon: 'fas fa-key',
					color: 'from-neutral-500 to-neutral-600',
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
					color: 'from-gray-500 to-gray-600',
					show: true
				},
				{
					label: '계정',
					value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A',
					icon: 'fas fa-calendar',
					color: 'from-slate-500 to-slate-600',
					show: true
				},
				{
					label: '권한',
					value: displayRoleName,
					icon: 'fas fa-shield-alt',
					color: 'from-zinc-500 to-zinc-600',
					show: true
				}
			].filter((stat) => stat.show),
			quickActions: (() => {
				const baseActions =
					user.userType === 'developer'
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
							];

				// 시스템 관리자 권한이 있는 경우 이메일 관리 액션 추가
				const userPermissions =
					typeof user.permissions === 'string' ? parseInt(user.permissions, 10) : user.permissions;

				if (userPermissions && (userPermissions & 1073741824) === 1073741824) {
					baseActions.push({
						label: '이메일\n관리',
						icon: 'fas fa-envelope-open-text',
						color: 'purple',
						action: navigateToEmailManagement
					});
				}

				return baseActions;
			})()
		};
	});

	let recentActivities = $state<{
		activities: {
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
				ipAddress?: string;
				userAgent?: string;
				severity?: string;
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
		}[];
		total: number;
	}>({ activities: [], total: 0 });

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
			if (
				user?.createdAt &&
				dashboardStats.accountCreated?.getTime() !== new Date(user.createdAt).getTime()
			) {
				dashboardStats.accountCreated = new Date(user.createdAt);
			}
		});

		return unsubscribe;
	});
	async function loadDashboardData() {
		if (isDashboardLoading) return; // 이미 로딩 중이면 중복 호출 방지

		try {
			isDashboardLoading = true;

			// 기본 통계와 새로운 분석 데이터들을 병렬로 로드
			const [stats, activities, tokenAnalyticsData, securityMetricsData, advancedAnalyticsData] =
				await Promise.all([
					apiClient.getDashboardStats(),
					apiClient.getRecentActivities(5),
					apiClient.getTokenAnalytics().catch(() => null), // 새로운 API들은 실패해도 기본 기능 유지
					apiClient.getSecurityMetrics().catch(() => null),
					apiClient.getAdvancedAnalytics().catch(() => null)
				]);

			dashboardStats = {
				...stats,
				// API 응답의 날짜 문자열을 Date 객체로 변환, null은 undefined로
				lastLoginDate: stats.lastLoginDate ? new Date(stats.lastLoginDate) : undefined,
				accountCreated: stats.accountCreated ? new Date(stats.accountCreated) : undefined
			};

			recentActivities = activities;

			// 새로운 분석 데이터들 설정 (API 호출이 성공한 경우에만)
			if (tokenAnalyticsData) {
				tokenAnalytics = tokenAnalyticsData;
			} else {
				// 기본값 설정
				tokenAnalytics = {
					usagePatterns: {
						peakHours: [],
						weeklyPatterns: [],
						monthlyTrends: []
					},
					clientPerformance: [],
					userActivity: {
						activeUsers: 0,
						newUsers: 0,
						returningUsers: 0,
						sessionDuration: 0,
						geographicDistribution: []
					}
				};
			}
			if (securityMetricsData) {
				securityMetrics = securityMetricsData;
			} else {
				// 기본값 설정
				securityMetrics = {
					alerts: {
						total: 0,
						critical: 0,
						high: 0,
						medium: 0,
						low: 0,
						byType: []
					},
					riskAnalysis: {
						overallRiskScore: 0,
						riskFactors: [],
						recommendations: []
					},
					threatDetection: {
						suspiciousActivities: 0,
						blockedAttempts: 0,
						geographicThreats: [],
						timeBasedPatterns: []
					},
					trends: {
						alertTrend: [],
						riskTrend: [],
						securityScore: 0
					}
				};
			}
			if (advancedAnalyticsData) {
				advancedAnalytics = advancedAnalyticsData;
			} else {
				// 기본값 설정
				advancedAnalytics = {
					tokenLifecycle: {
						creationToExpiration: [],
						revocationReasons: [],
						lifetimeDistribution: []
					},
					clientAnalytics: {
						topClients: [],
						clientHealth: [],
						usageCorrelation: []
					},
					predictiveInsights: {
						tokenDemand: { predicted: 0, confidence: 0, trend: '' },
						riskPrediction: { level: '', factors: [], mitigation: [] },
						systemCapacity: { current: 0, predicted: 0, bottleneck: '' }
					}
				};
			}
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
			// API 호출 실패 시 user 객체에서 데이터 사용
			dashboardStats = {
				totalClients: 0,
				activeTokens: 0,
				totalTokensIssued: 0,
				expiredTokens: 0,
				revokedTokens: 0,
				lastLoginDate: undefined,
				accountCreated: user?.createdAt ? new Date(user.createdAt) : undefined,
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

			// API 실패 시 다른 데이터들도 기본값으로 설정
			tokenAnalytics = {
				usagePatterns: {
					peakHours: [],
					weeklyPatterns: [],
					monthlyTrends: []
				},
				clientPerformance: [],
				userActivity: {
					activeUsers: 0,
					newUsers: 0,
					returningUsers: 0,
					sessionDuration: 0,
					geographicDistribution: []
				}
			};

			securityMetrics = {
				alerts: {
					total: 0,
					critical: 0,
					high: 0,
					medium: 0,
					low: 0,
					byType: []
				},
				riskAnalysis: {
					overallRiskScore: 0,
					riskFactors: [],
					recommendations: []
				},
				threatDetection: {
					suspiciousActivities: 0,
					blockedAttempts: 0,
					geographicThreats: [],
					timeBasedPatterns: []
				},
				trends: {
					alertTrend: [],
					riskTrend: [],
					securityScore: 0
				}
			};

			advancedAnalytics = {
				tokenLifecycle: {
					creationToExpiration: [],
					revocationReasons: [],
					lifetimeDistribution: []
				},
				clientAnalytics: {
					topClients: [],
					clientHealth: [],
					usageCorrelation: []
				},
				predictiveInsights: {
					tokenDemand: { predicted: 0, confidence: 0, trend: '' },
					riskPrediction: { level: '', factors: [], mitigation: [] },
					systemCapacity: { current: 0, predicted: 0, bottleneck: '' }
				}
			};

			recentActivities = { activities: [], total: 0 };

			toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
		} finally {
			isDashboardLoading = false;
			isDashboardDataLoaded = true; // 데이터 로드 시도 완료 표시
		}
	}

	function navigateToOAuthTester() {
		goto('/dashboard/oauth-tester');
	}
	function navigateToProfile() {
		goto('/dashboard/profile');
	}

	function navigateToClients() {
		goto('/dashboard/clients');
	}

	function navigateToTokens() {
		goto('/dashboard/tokens');
	}

	function navigateToEmailManagement() {
		goto('/dashboard/email-management');
	}

	function _navigateToSettings() {
		goto('/dashboard/settings');
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
		<StatsCards {dashboardStats} {user} {isDeveloper} roleName={userTypeConfig.displayRoleName} />
	{/if}

	<!-- 탭 인터페이스 -->
	<div class="mb-6 overflow-hidden rounded-xl bg-white shadow-lg lg:mb-8">
		<Tabs {tabs} bind:activeTab>
			{#snippet children({ activeTab })}
				<!-- 탭 콘텐츠 -->
				<div class="p-6">
					{#if activeTab === 'overview'}
						<!-- 개요 탭 -->
						<OverviewTab
							{user}
							isLoading={isDashboardLoading}
							onNavigateToProfile={navigateToProfile}
						/>
					{:else if activeTab === 'analytics'}
						<!-- 분석 탭 -->
						<AnalyticsTab
							isLoading={isDashboardLoading}
							{securityMetrics}
							{tokenAnalytics}
							{dashboardStats}
							{advancedAnalytics}
						/>
					{:else if activeTab === 'activity'}
						<!-- 최근 활동 탭 -->
						<ActivityTab {recentActivities} {isDashboardLoading} />
					{:else if activeTab === 'quick-actions'}
						<!-- 빠른 작업 탭 -->
						{#if userTypeConfig}
							<QuickActionsTab quickActions={userTypeConfig.quickActions} />
						{/if}
					{/if}
				</div>
			{/snippet}
		</Tabs>
	</div>
</DashboardLayout>
