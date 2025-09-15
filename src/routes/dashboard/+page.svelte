<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, Tabs, apiClient } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';

	let user = $state<User | null>(null);
	let _isLoading = $state(true);

	let dashboardStats = $state({
		totalClients: 0,
		activeTokens: 0,
		lastLoginDate: null as Date | null,
		accountCreated: null as Date | null
	});

	const toast = useToast();

	onMount(() => {
		// store 구독
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			_isLoading = state.isLoading;
		});

		// 대시보드 통계 로드
		loadDashboardData().catch(console.error);

		return unsubscribe;
	});
	async function loadDashboardData() {
		try {
			// 실제 API 호출로 대시보드 통계 가져오기
			const stats = await apiClient.getDashboardStats();
			dashboardStats = stats;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
			toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
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

	// 탭 설정
	const tabs = [
		{ id: 'overview', label: '개요', icon: 'fas fa-tachometer-alt' },
		{ id: 'activity', label: '최근 활동', icon: 'fas fa-clock' },
		{ id: 'quick-actions', label: '빠른 작업', icon: 'fas fa-bolt' }
	];

	let activeTab = $state('overview');
</script>

<DashboardLayout title="대시보드" description="OAuth2 인증 시스템을 관리하고 모니터링하세요.">
	<!-- 통계 카드들 -->
	<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<!-- 총 클라이언트 수 -->
		<Card
			class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
		>
			<div class="relative p-4 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center justify-between">
							<i class="fas fa-users text-2xl opacity-80 sm:text-3xl"></i>
							<span class="text-xs opacity-70">총계</span>
						</div>
						<p class="mb-1 text-sm font-medium opacity-80">클라이언트</p>
						<p class="text-xl font-bold sm:text-2xl">{dashboardStats.totalClients}</p>
					</div>
				</div>
				<div class="absolute -right-4 -bottom-4 opacity-10">
					<i class="fas fa-users text-6xl sm:text-8xl"></i>
				</div>
			</div>
		</Card>

		<!-- 활성 토큰 수 -->
		<Card
			class="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
		>
			<div class="relative p-4 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center justify-between">
							<i class="fas fa-key text-2xl opacity-80 sm:text-3xl"></i>
							<span class="text-xs opacity-70">활성</span>
						</div>
						<p class="mb-1 text-sm font-medium opacity-80">토큰</p>
						<p class="text-xl font-bold sm:text-2xl">{dashboardStats.activeTokens}</p>
					</div>
				</div>
				<div class="absolute -right-4 -bottom-4 opacity-10">
					<i class="fas fa-key text-6xl sm:text-8xl"></i>
				</div>
			</div>
		</Card>

		<!-- 마지막 로그인 -->
		<Card
			class="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
		>
			<div class="relative p-4 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center justify-between">
							<i class="fas fa-clock text-2xl opacity-80 sm:text-3xl"></i>
							<span class="text-xs opacity-70">최근</span>
						</div>
						<p class="mb-1 text-sm font-medium opacity-80">로그인</p>
						<p class="text-xs leading-tight font-bold sm:text-sm">
							{dashboardStats.lastLoginDate?.toLocaleDateString('ko-KR', {
								month: 'short',
								day: 'numeric'
							}) || 'N/A'}
						</p>
					</div>
				</div>
				<div class="absolute -right-4 -bottom-4 opacity-10">
					<i class="fas fa-clock text-6xl sm:text-8xl"></i>
				</div>
			</div>
		</Card>

		<!-- 계정 생성일 -->
		<Card
			class="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
		>
			<div class="relative p-4 sm:p-6">
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="mb-2 flex items-center justify-between">
							<i class="fas fa-calendar text-2xl opacity-80 sm:text-3xl"></i>
							<span class="text-xs opacity-70">생성</span>
						</div>
						<p class="mb-1 text-sm font-medium opacity-80">계정</p>
						<p class="text-xs leading-tight font-bold sm:text-sm">
							{dashboardStats.accountCreated?.toLocaleDateString('ko-KR', {
								year: '2-digit',
								month: 'short'
							}) || 'N/A'}
						</p>
					</div>
				</div>
				<div class="absolute -right-4 -bottom-4 opacity-10">
					<i class="fas fa-calendar text-6xl sm:text-8xl"></i>
				</div>
			</div>
		</Card>
	</div>

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
													<Badge variant="info" size="sm" class="ml-1">관리자</Badge>
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
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
							</div>
						</Card>
					</div>
				{:else if activeTab === 'activity'}
					<!-- 최근 활동 탭 -->
					<div class="space-y-4">
						<h3 class="text-lg font-semibold text-gray-900">최근 활동</h3>
						<div class="space-y-3">
							<div class="flex items-center space-x-3 rounded-lg border border-gray-200 p-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
									<i class="fas fa-sign-in-alt text-blue-600"></i>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">로그인</p>
									<p class="text-xs text-gray-500">방금 전</p>
								</div>
							</div>
							<div class="flex items-center space-x-3 rounded-lg border border-gray-200 p-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
									<i class="fas fa-key text-green-600"></i>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">새 토큰 생성</p>
									<p class="text-xs text-gray-500">2시간 전</p>
								</div>
							</div>
							<div class="flex items-center space-x-3 rounded-lg border border-gray-200 p-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
									<i class="fas fa-plus text-purple-600"></i>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">클라이언트 등록</p>
									<p class="text-xs text-gray-500">1일 전</p>
								</div>
							</div>
						</div>
					</div>
				{:else if activeTab === 'quick-actions'}
					<!-- 빠른 작업 탭 -->
					<div class="space-y-4 sm:space-y-6">
						<div class="text-center sm:text-left">
							<h3 class="mb-2 text-lg font-semibold text-gray-900">빠른 작업</h3>
							<p class="text-sm text-gray-600">자주 사용하는 기능을 빠르게 실행하세요</p>
						</div>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<Button
								variant="outline"
								class="group flex h-20 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 transition-all duration-200 hover:scale-105 hover:border-blue-500 hover:bg-blue-50 sm:h-24"
								onclick={navigateToClients}
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 transition-colors duration-200 group-hover:bg-blue-200 sm:h-10 sm:w-10"
								>
									<i class="fas fa-plus-circle text-lg text-blue-600 sm:text-xl"></i>
								</div>
								<span class="text-center text-xs leading-tight font-medium sm:text-sm"
									>새 클라이언트<br />생성</span
								>
							</Button>

							<Button
								variant="outline"
								class="group flex h-20 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 transition-all duration-200 hover:scale-105 hover:border-green-500 hover:bg-green-50 sm:h-24"
								onclick={navigateToTokens}
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 transition-colors duration-200 group-hover:bg-green-200 sm:h-10 sm:w-10"
								>
									<i class="fas fa-key text-lg text-green-600 sm:text-xl"></i>
								</div>
								<span class="text-center text-xs leading-tight font-medium sm:text-sm"
									>토큰<br />관리</span
								>
							</Button>

							<Button
								variant="outline"
								class="group flex h-20 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 transition-all duration-200 hover:scale-105 hover:border-purple-500 hover:bg-purple-50 sm:h-24"
								onclick={navigateToSettings}
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 transition-colors duration-200 group-hover:bg-purple-200 sm:h-10 sm:w-10"
								>
									<i class="fas fa-cog text-lg text-purple-600 sm:text-xl"></i>
								</div>
								<span class="text-center text-xs leading-tight font-medium sm:text-sm"
									>시스템<br />설정</span
								>
							</Button>

							<Button
								variant="outline"
								class="group flex h-20 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 transition-all duration-200 hover:scale-105 hover:border-orange-500 hover:bg-orange-50 sm:h-24"
								onclick={navigateToOAuthTester}
							>
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 transition-colors duration-200 group-hover:bg-orange-200 sm:h-10 sm:w-10"
								>
									<i class="fas fa-link text-lg text-orange-600 sm:text-xl"></i>
								</div>
								<span class="text-center text-xs leading-tight font-medium sm:text-sm"
									>OAuth2<br />테스터</span
								>
							</Button>
						</div>
					</div>
				{/if}
			{/snippet}
		</Tabs>
	</Card>
</DashboardLayout>
