<script lang="ts">
	import { Card, Button, Badge, Loading, Tabs } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	let dashboardStats = $state({
		totalClients: 0,
		activeTokens: 0,
		lastLoginDate: null as Date | null,
		accountCreated: null as Date | null
	});

	// 중앙화된 토스트 훅 사용
	const toast = useToast();

	onMount(async () => {
		// 인증 상태 초기화
		await authStore.initialize();

		// store 구독
		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		// 대시보드 데이터 로드
		await loadDashboardData();
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

	async function loadDashboardData() {
		try {
			// TODO: API 호출로 실제 데이터 가져오기
			dashboardStats = {
				totalClients: 3,
				activeTokens: 7,
				lastLoginDate: new Date(),
				accountCreated: new Date('2024-01-15')
			};
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		}
	}

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();

		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	// 빠른 액션 함수들
	function navigateToProfile() {
		window.location.href = '/dashboard/profile';
	}

	function navigateToClients() {
		window.location.href = '/dashboard/clients';
	}

	function navigateToTokens() {
		window.location.href = '/dashboard/tokens';
	}

	function navigateToSettings() {
		window.location.href = '/dashboard/settings';
	}

	// 토스트 메시지 함수들
	function showSuccessToast() {
		toast.success('성공 메시지입니다!');
	}

	function showErrorToast() {
		toast.error('에러 메시지입니다!');
	}

	function showWarningToast() {
		toast.warning('경고 메시지입니다!');
	}

	function showInfoToast() {
		toast.info('정보 메시지입니다!');
	}

	// 탭 설정
	const tabs = [
		{ id: 'overview', label: '개요', icon: 'fas fa-tachometer-alt' },
		{ id: 'activity', label: '최근 활동', icon: 'fas fa-clock' },
		{ id: 'quick-actions', label: '빠른 작업', icon: 'fas fa-bolt' }
	];

	let activeTab = $state('overview');
</script>

<svelte:head>
	<title>대시보드 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="대시보드를 불러오는 중..." />
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<h1 class="text-2xl font-bold text-gray-900">
								<i class="fas fa-shield-alt mr-2 text-blue-600"></i>
								FlowAuth
							</h1>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<div class="hidden sm:block">
							<span class="text-sm text-gray-600">
								안녕하세요, <span class="font-semibold text-gray-900">{user.firstName} {user.lastName}</span>님
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
			<!-- 웰컴 섹션 -->
			<div class="mb-8">
				<div class="mb-4">
					<h2 class="text-3xl font-bold text-gray-900">대시보드</h2>
					<p class="mt-2 text-lg text-gray-600">
						OAuth2 인증 시스템을 관리하고 모니터링하세요.
					</p>
				</div>

				<!-- 통계 카드들 -->
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					<!-- 총 클라이언트 수 -->
					<Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-users text-3xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">총 클라이언트</p>
								<p class="text-2xl font-bold">{dashboardStats.totalClients}</p>
							</div>
						</div>
					</Card>

					<!-- 활성 토큰 수 -->
					<Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-key text-3xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">활성 토큰</p>
								<p class="text-2xl font-bold">{dashboardStats.activeTokens}</p>
							</div>
						</div>
					</Card>

					<!-- 마지막 로그인 -->
					<Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-clock text-3xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">마지막 로그인</p>
								<p class="text-sm font-bold">
									{dashboardStats.lastLoginDate?.toLocaleDateString('ko-KR') || 'N/A'}
								</p>
							</div>
						</div>
					</Card>

					<!-- 계정 생성일 -->
					<Card class="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-calendar text-3xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">계정 생성일</p>
								<p class="text-sm font-bold">
									{dashboardStats.accountCreated?.toLocaleDateString('ko-KR') || 'N/A'}
								</p>
							</div>
						</div>
					</Card>
				</div>
			</div>

			<!-- 탭 인터페이스 -->
			<Card class="mb-8">
				<Tabs {tabs} bind:activeTab>
					{#snippet children({ activeTab })}
						{#if activeTab === 'overview'}
							<!-- 개요 탭 -->
							<div class="space-y-6">
								<!-- 사용자 정보 카드 -->
								<Card class="border-l-4 border-l-blue-500">
									<div class="flex items-center justify-between">
										<div>
											<h3 class="text-lg font-semibold text-gray-900">계정 정보</h3>
											<div class="mt-2 space-y-1 text-sm text-gray-600">
												<p><span class="font-medium">사용자명:</span> {user?.username}</p>
												<p><span class="font-medium">이메일:</span> {user?.email}</p>
												<p><span class="font-medium">이름:</span> {user?.firstName} {user?.lastName}</p>
												<p>
													<span class="font-medium">역할:</span>
													<Badge variant="info" size="sm" class="ml-1">
														관리자
													</Badge>
												</p>
											</div>
										</div>
										<Button variant="outline" onclick={navigateToProfile}>
											<i class="fas fa-edit mr-2"></i>
											편집
										</Button>
									</div>
								</Card>

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
							<div class="space-y-6">
								<h3 class="text-lg font-semibold text-gray-900">빠른 작업</h3>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<Button
										variant="outline"
										class="flex h-24 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
										onclick={navigateToClients}
									>
										<i class="fas fa-plus-circle text-2xl text-blue-600"></i>
										<span class="text-sm font-medium">새 클라이언트 생성</span>
									</Button>
									
									<Button
										variant="outline"
										class="flex h-24 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50"
										onclick={navigateToTokens}
									>
										<i class="fas fa-key text-2xl text-green-600"></i>
										<span class="text-sm font-medium">토큰 관리</span>
									</Button>
									
									<Button
										variant="outline"
										class="flex h-24 flex-col items-center justify-center space-y-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50"
										onclick={navigateToSettings}
									>
										<i class="fas fa-cog text-2xl text-purple-600"></i>
										<span class="text-sm font-medium">설정</span>
									</Button>
								</div>
							</div>
						{/if}
					{/snippet}
				</Tabs>
			</Card>
		</main>
	</div>
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

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<i class="fas fa-spinner fa-spin mb-4 text-4xl text-blue-500"></i>
			<p class="text-gray-600">로딩 중...</p>
		</div>
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<h1 class="text-2xl font-bold text-gray-900">FlowAuth</h1>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-700">
							안녕하세요, <span class="font-semibold">{user.firstName} {user.lastName}</span>님
						</span>
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
			<div class="mb-8">
				<h2 class="mb-2 text-3xl font-bold text-gray-900">대시보드</h2>
				<p class="text-gray-600">FlowAuth에 오신 것을 환영합니다!</p>
			</div>

			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- 사용자 정보 카드 -->
				<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
					<div class="mb-4 flex items-center">
						<div class="mr-4 rounded-lg bg-blue-100 p-3">
							<i class="fas fa-user text-xl text-blue-600"></i>
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">프로필 정보</h3>
							<p class="text-sm text-gray-600">사용자 정보 관리</p>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">사용자 이름:</span>
							<span class="text-sm font-medium">{user.username}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">이메일:</span>
							<span class="text-sm font-medium">{user.email}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">이름:</span>
							<span class="text-sm font-medium">{user.firstName} {user.lastName}</span>
						</div>
					</div>
				</Card>

				<!-- OAuth 클라이언트 카드 -->
				<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
					<div class="mb-4 flex items-center">
						<div class="mr-4 rounded-lg bg-green-100 p-3">
							<i class="fas fa-cogs text-xl text-green-600"></i>
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">OAuth 클라이언트</h3>
							<p class="text-sm text-gray-600">클라이언트 애플리케이션 관리</p>
						</div>
					</div>
					<div class="py-4 text-center">
						<Button variant="primary" class="w-full">
							<i class="fas fa-plus mr-2"></i>
							새 클라이언트 생성
						</Button>
					</div>
				</Card>

				<!-- 보안 설정 카드 -->
				<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
					<div class="mb-4 flex items-center">
						<div class="mr-4 rounded-lg bg-purple-100 p-3">
							<i class="fas fa-shield-alt text-xl text-purple-600"></i>
						</div>
						<div>
							<h3 class="text-lg font-semibold text-gray-900">보안 설정</h3>
							<p class="text-sm text-gray-600">계정 보안 관리</p>
						</div>
					</div>
					<div class="py-4 text-center">
						<Button variant="outline" class="w-full">
							<i class="fas fa-key mr-2"></i>
							비밀번호 변경
						</Button>
					</div>
				</Card>
			</div>

			<!-- 토스트 시스템 테스트 섹션 -->
			<Card class="mb-8 border-0 bg-white/80 shadow-lg backdrop-blur-sm">
				<div class="mb-6 flex items-center">
					<i class="fas fa-bell mr-3 text-xl text-gray-600"></i>
					<h3 class="text-xl font-semibold text-gray-900">토스트 알림 테스트</h3>
				</div>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
					<Button variant="primary" onclick={showSuccessToast} class="w-full">
						<i class="fas fa-check mr-2"></i>
						성공
					</Button>
					<Button
						variant="secondary"
						onclick={showErrorToast}
						class="w-full bg-red-600 hover:bg-red-700"
					>
						<i class="fas fa-times mr-2"></i>
						에러
					</Button>
					<Button
						variant="outline"
						onclick={showWarningToast}
						class="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
					>
						<i class="fas fa-exclamation-triangle mr-2"></i>
						경고
					</Button>
					<Button
						variant="outline"
						onclick={showInfoToast}
						class="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
					>
						<i class="fas fa-info-circle mr-2"></i>
						정보
					</Button>
				</div>
			</Card>

			<!-- 최근 활동 -->
			<Card class="border-0 bg-white/80 shadow-lg backdrop-blur-sm">
				<div class="mb-6 flex items-center">
					<i class="fas fa-history mr-3 text-xl text-gray-600"></i>
					<h3 class="text-xl font-semibold text-gray-900">최근 활동</h3>
				</div>
				<div class="space-y-4">
					<div class="flex items-center border-b border-gray-100 py-3 last:border-b-0">
						<div class="mr-4 rounded-full bg-blue-100 p-2">
							<i class="fas fa-sign-in-alt text-blue-600"></i>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">로그인</p>
							<p class="text-xs text-gray-500">방금 전</p>
						</div>
					</div>
					<div class="flex items-center border-b border-gray-100 py-3 last:border-b-0">
						<div class="mr-4 rounded-full bg-green-100 p-2">
							<i class="fas fa-user-plus text-green-600"></i>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">계정 생성</p>
							<p class="text-xs text-gray-500">오늘</p>
						</div>
					</div>
				</div>
			</Card>
		</main>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
			<h2 class="mb-2 text-xl font-semibold text-gray-900">접근 권한 없음</h2>
			<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
			<Button variant="primary" onclick={() => (window.location.href = '/auth/login')}>
				로그인 페이지로 이동
			</Button>
		</div>
	</div>
{/if}
