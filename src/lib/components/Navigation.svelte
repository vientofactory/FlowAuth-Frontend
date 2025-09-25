<script lang="ts">
	import { authState, authStore, Button } from '$lib';
	import { onMount } from 'svelte';
	import type { User } from '$lib';
	import { USER_TYPES, PERMISSIONS } from '$lib/types/user.types';
	import { env } from '$lib/config/env';

	// 프로필 메뉴 아이템 타입 정의
	type ProfileMenuItem = {
		label: string;
		icon: string;
		href?: string;
		action?: () => Promise<void>;
		danger?: boolean;
		external?: boolean;
	};

	interface Props {
		showDashboardButton?: boolean;
		showProfileBadge?: boolean;
		transparent?: boolean;
	}

	let {
		showDashboardButton = true,
		showProfileBadge = true,
		transparent = false
	}: Props = $props();

	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let _isLoading = $state(true); // 초기 상태를 로딩 중으로 설정
	let mobileMenuOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let initialAuthCheckDone = $state(false); // 초기 인증 확인 완료 여부

	// authState를 reactive하게 연결 - Svelte 5 store subscribe 방식
	$effect(() => {
		const unsubscribeEffect = authState.subscribe((state) => {
			user = state.user;
			isAuthenticated = state.isAuthenticated;
			_isLoading = state.isLoading;
			initialAuthCheckDone = true;

			console.log('Navigation: Auth state changed', {
				user: state.user,
				avatar: state.user?.avatar,
				isAuthenticated: state.isAuthenticated,
				isInitialized: state.isInitialized
			});
		});

		return () => {
			unsubscribeEffect();
		};
	});

	onMount(() => {
		console.log('Navigation: Component mounted');

		// 드롭다운 외부 클릭 감지
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.profile-dropdown')) {
				profileDropdownOpen = false;
			}
		};

		// ESC 키 이벤트 핸들러
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				profileDropdownOpen = false;
				mobileMenuOpen = false;
			}
		};

		document.addEventListener('click', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	async function handleLogout() {
		profileDropdownOpen = false;
		try {
			await authStore.logout();
			location.href = '/';
		} catch (error) {
			console.error('Logout failed:', error);
			// 로그아웃 실패 시에도 클라이언트 측 정리
			authState.set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
			window.location.href = '/';
		}
	}

	// 사용자 유형별 프로필 메뉴 아이템들
	const profileMenuItems = $derived.by((): ProfileMenuItem[] => {
		if (!user) return [];

		const isDeveloper = user.userType === USER_TYPES.DEVELOPER;

		const baseItems = [
			{
				label: '프로필',
				icon: 'fas fa-user',
				href: '/dashboard/profile'
			}
		];

		const developerItems = [
			{
				label: '내 애플리케이션',
				icon: 'fas fa-cubes',
				href: '/dashboard/clients'
			},
			{
				label: 'OAuth2 테스터',
				icon: 'fas fa-flask',
				href: '/dashboard/oauth-tester'
			},
			{
				label: 'API 문서',
				icon: 'fas fa-book',
				href: '/docs',
				external: true
			}
		];

		const regularUserItems = [
			{
				label: '연결된 앱',
				icon: 'fas fa-link',
				href: '/dashboard/connections'
			},
			{
				label: '활동 로그',
				icon: 'fas fa-history',
				href: '/dashboard/activity'
			}
		];

		const commonItems = [
			{
				label: '로그아웃',
				icon: 'fas fa-sign-out-alt',
				action: handleLogout,
				danger: true
			}
		];

		// 시스템 관리 권한이 있는 경우에만 설정 메뉴 추가
		const hasSystemManagePermission = (user.permissions & PERMISSIONS.MANAGE_SYSTEM) !== 0;
		const systemItems = hasSystemManagePermission
			? [
					{
						label: '설정',
						icon: 'fas fa-cog',
						href: '/dashboard/settings'
					}
				]
			: [];

		const userTypeItems = isDeveloper ? developerItems : regularUserItems;

		return [...baseItems, ...userTypeItems, ...systemItems, ...commonItems];
	});
</script>

<!-- 네비게이션 바 -->
<header
	class="sticky top-0 z-50 border-b {transparent
		? 'border-gray-200/50 bg-white/80 backdrop-blur-md'
		: 'border-gray-200 bg-white shadow-sm'}"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="relative flex h-16 items-center justify-between">
			<!-- 로고 -->
			<a href="/" class="flex cursor-pointer items-center">
				<img src="/logo_1.png" alt="FlowAuth Logo" class="h-8 w-auto rounded object-contain" />
			</a>

			<!-- 데스크톱 네비게이션 -->
			<div class="hidden items-center space-x-4 md:flex">
				{#if !initialAuthCheckDone}
					<!-- 초기 인증 확인 중: 프로필 배지 스켈레톤 -->
					<div
						class="flex items-center space-x-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm"
					>
						<!-- 아바타 스켈레톤 -->
						<div
							class="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
						>
							<div class="h-4 w-4 rounded-full bg-gray-300 opacity-60"></div>
						</div>
						<!-- 이름 텍스트 스켈레톤 -->
						<div
							class="hidden h-4 w-20 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 lg:block"
						></div>
						<!-- 화살표 아이콘 스켈레톤 -->
						<div
							class="h-3 w-3 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
						></div>
					</div>
				{:else if isAuthenticated}
					<!-- 사용자 유형별 빠른 액세스 메뉴 -->
					{#if user?.userType === USER_TYPES.DEVELOPER}
						<!-- 개발자용 퀵 액션 메뉴 -->
						<div class="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onclick={() => (window.location.href = '/dashboard/clients')}
								class="border-gray-300 text-gray-700 hover:bg-gray-50"
								title="내 애플리케이션"
							>
								<i class="fas fa-cubes mr-2"></i>
								<span class="hidden lg:inline">앱</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => (window.location.href = '/dashboard/oauth-tester')}
								class="border-gray-300 text-gray-700 hover:bg-gray-50"
								title="OAuth2 테스터"
							>
								<i class="fas fa-flask mr-2"></i>
								<span class="hidden lg:inline">테스터</span>
							</Button>
						</div>
					{:else}
						<!-- 일반 사용자용 퀵 액션 메뉴 -->
						<Button
							variant="outline"
							size="sm"
							onclick={() => (window.location.href = '/dashboard/profile')}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
							title="프로필 설정"
						>
							<i class="fas fa-user mr-2"></i>
							<span class="hidden lg:inline">프로필</span>
						</Button>
					{/if}

					<!-- 대시보드 버튼 -->
					{#if showDashboardButton}
						<Button
							variant="outline"
							size="sm"
							onclick={() => (window.location.href = '/dashboard')}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-tachometer-alt mr-2"></i>
							대시보드
						</Button>
					{/if}

					<!-- 프로필 배지 -->
					{#if showProfileBadge}
						{#if initialAuthCheckDone}
							<div class="profile-dropdown relative">
								<button
									class="flex items-center space-x-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
									onclick={() => (profileDropdownOpen = !profileDropdownOpen)}
								>
									<!-- 프로필 사진 또는 이니셜 표시 -->
									{#if user?.avatar}
										<img
											src={user.avatar.startsWith('http')
												? user.avatar
												: `${env.API_BASE_URL}${user.avatar}`}
											alt="프로필 사진"
											class="h-8 w-8 rounded-full border border-gray-200 object-cover"
										/>
									{:else}
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
											<span class="text-sm font-medium text-blue-800">
												{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
											</span>
										</div>
									{/if}
									<span class="hidden lg:block">{user?.firstName} {user?.lastName}</span>
									<i class="fas fa-chevron-down text-xs"></i>
								</button>

								<!-- 프로필 드롭다운 메뉴 -->
								{#if profileDropdownOpen}
									<div
										class="ring-opacity-5 animate-in fade-in slide-in-from-top-2 dropdown-shadow absolute right-0 z-50 mt-2 w-56 origin-top-right transform rounded-lg bg-white py-2 shadow-xl ring-1 ring-gray-200/50 transition-all duration-200 ease-out focus:outline-none"
									>
										<div class="mb-1 border-b border-gray-100 px-4 py-3">
											<div class="flex items-center space-x-3">
												<!-- 프로필 사진 또는 이니셜 표시 -->
												{#if user?.avatar}
													<img
														src={user.avatar.startsWith('http')
															? user.avatar
															: `${env.API_BASE_URL}${user.avatar}`}
														alt="프로필 사진"
														class="h-10 w-10 rounded-full border border-gray-200 object-cover"
													/>
												{:else}
													<div
														class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"
													>
														<span class="text-sm font-medium text-blue-800">
															{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
														</span>
													</div>
												{/if}
												<div class="min-w-0 flex-1">
													<p class="truncate text-sm font-semibold text-gray-900">
														{user?.firstName}
														{user?.lastName}
													</p>
													<p class="mt-0.5 truncate text-xs text-gray-500">{user?.email}</p>
													{#if user?.userType}
														<div class="mt-1">
															<span
																class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
															>
																{user.userType === USER_TYPES.DEVELOPER ? '개발자' : '일반 사용자'}
															</span>
														</div>
													{/if}
												</div>
											</div>
										</div>
										<div class="space-y-1">
											{#each profileMenuItems as item (item.label)}
												{#if item.href}
													<a
														href={item.href}
														class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
														onclick={() => (profileDropdownOpen = false)}
													>
														<i class="{item.icon} mr-3 w-4 text-center text-gray-400"></i>
														{item.label}
													</a>
												{:else if item.action}
													<button
														onclick={() => {
															item.action?.();
															profileDropdownOpen = false;
														}}
														class="mx-1 flex w-full items-center rounded-md px-4 py-2.5 text-sm transition-colors duration-150 {item.danger
															? 'text-red-600 hover:bg-red-50 hover:text-red-700'
															: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}"
													>
														<i
															class="{item.icon} mr-3 w-4 text-center {item.danger
																? ''
																: 'text-gray-400'}"
														></i>
														{item.label}
													</button>
												{/if}
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<!-- 인증 상태 초기화 중: 프로필 배지 스켈레톤 -->
							<div
								class="flex items-center space-x-2 rounded-full border border-gray-300 bg-white px-3 py-2 shadow-sm"
							>
								<div
									class="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
								>
									<div class="h-4 w-4 rounded-full bg-gray-300 opacity-60"></div>
								</div>
								<div
									class="hidden h-4 w-20 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 lg:block"
								></div>
								<div
									class="h-3 w-3 animate-pulse rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
								></div>
							</div>
						{/if}
					{/if}
				{:else}
					<!-- 비로그인 상태: 로그인/회원가입 버튼 -->
					<a
						href="/auth/login"
						data-sveltekit-preload-data
						class="font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600"
					>
						로그인
					</a>
					<Button
						variant="primary"
						onclick={() => (window.location.href = '/auth/register')}
						class="shadow-md transition-shadow duration-200 hover:shadow-lg"
					>
						회원가입
					</Button>
				{/if}
			</div>

			<!-- 모바일 메뉴 버튼 -->
			<div class="md:hidden">
				{#if !initialAuthCheckDone}
					<!-- 초기 인증 확인 중: 프로필 버튼 모양 스켈레톤 -->
					<div
						class="skeleton-shimmer flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
					>
						<div class="h-4 w-4 rounded-full bg-gray-300 opacity-60"></div>
					</div>
				{:else if isAuthenticated}
					<!-- 로그인 상태: 프로필 버튼 -->
					<div class="relative">
						<button
							class="profile-dropdown flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 transition-colors duration-200 {profileDropdownOpen
								? 'ring-2 ring-blue-300'
								: ''}"
							onclick={() => (profileDropdownOpen = !profileDropdownOpen)}
							aria-expanded={profileDropdownOpen}
							aria-label="프로필 메뉴"
						>
							<!-- 모바일에서도 아바타 표시 -->
							{#if user?.avatar}
								<img
									src={user.avatar.startsWith('http')
										? user.avatar
										: `${env.API_BASE_URL}${user.avatar}`}
									alt="프로필 사진"
									class="h-8 w-8 rounded-full border border-gray-200 object-cover"
								/>
							{:else}
								<span class="text-sm font-medium">
									{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
								</span>
							{/if}
						</button>

						<!-- 모바일 프로필 드롭다운 메뉴 -->
						{#if profileDropdownOpen}
							<div
								class="ring-opacity-5 animate-in fade-in slide-in-from-top-2 dropdown-shadow absolute right-0 z-50 mt-2 w-48 origin-top-right transform rounded-lg bg-white py-2 shadow-xl ring-1 ring-gray-200/50 transition-all duration-200 ease-out focus:outline-none"
							>
								<div class="mb-1 border-b border-gray-100 px-4 py-3">
									<p class="text-sm font-semibold text-gray-900">
										{user?.firstName}
										{user?.lastName}
									</p>
									<p class="mt-0.5 text-xs text-gray-500">{user?.email}</p>
								</div>
								<div class="space-y-1">
									<a
										href="/dashboard/profile"
										class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
										onclick={() => (profileDropdownOpen = false)}
									>
										<i class="fas fa-user mr-3 w-4 text-center text-gray-400"></i>
										프로필
									</a>

									<!-- 모바일 프로필 드롭다운에서도 사용자 유형별 메뉴 -->
									{#if user?.userType === USER_TYPES.DEVELOPER}
										<a
											href="/dashboard/clients"
											class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
											onclick={() => (profileDropdownOpen = false)}
										>
											<i class="fas fa-cubes mr-3 w-4 text-center text-gray-400"></i>
											내 애플리케이션
										</a>
										<a
											href="/dashboard/oauth-tester"
											class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
											onclick={() => (profileDropdownOpen = false)}
										>
											<i class="fas fa-flask mr-3 w-4 text-center text-gray-400"></i>
											OAuth2 테스터
										</a>
									{:else}
										<a
											href="/dashboard/connections"
											class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
											onclick={() => (profileDropdownOpen = false)}
										>
											<i class="fas fa-link mr-3 w-4 text-center text-gray-400"></i>
											연결된 앱
										</a>
									{/if}

									<a
										href="/dashboard/settings"
										class="mx-1 flex items-center rounded-md px-4 py-2.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
										onclick={() => (profileDropdownOpen = false)}
									>
										<i class="fas fa-cog mr-3 w-4 text-center text-gray-400"></i>
										설정
									</a>
									<div class="my-1 border-t border-gray-100"></div>
									<button
										onclick={() => {
											handleLogout();
											profileDropdownOpen = false;
										}}
										class="mx-1 flex w-full items-center rounded-md px-4 py-2.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
									>
										<i class="fas fa-sign-out-alt mr-3 w-4 text-center"></i>
										로그아웃
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- 비로그인 상태: 햄버거 메뉴 -->
					<button
						class="p-2 text-gray-600 hover:text-blue-600"
						aria-label="메뉴 열기"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					>
						<i class="fas fa-bars text-xl"></i>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- 모바일 드롭다운 메뉴 -->
	{#if mobileMenuOpen}
		<!-- 백드롭 (외부 클릭 시 메뉴 닫기) - 투명한 배경 -->
		<button
			type="button"
			class="reset-button fixed top-16 right-0 bottom-0 left-0 z-40 bg-transparent md:hidden"
			aria-label="메뉴 닫기"
			tabindex="0"
			onclick={() => (mobileMenuOpen = false)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					mobileMenuOpen = false;
				}
			}}
		></button>

		<!-- 드롭다운 메뉴 -->
		<div
			class="fixed top-16 right-0 left-0 z-50 border-t border-gray-200 bg-white shadow-lg md:hidden"
		>
			<div class="max-h-[calc(100vh-4rem)] overflow-y-auto">
				{#if isAuthenticated}
					<!-- 로그인 상태 메뉴 -->
					<div class="border-b border-gray-100 px-4 py-3">
						<div class="flex items-center space-x-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
								<span class="text-sm font-medium text-blue-800">
									{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
								</span>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
								<p class="text-xs text-gray-500">{user?.email}</p>
							</div>
						</div>
					</div>

					<div class="py-2">
						<a
							href="/dashboard"
							class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
							onclick={() => (mobileMenuOpen = false)}
						>
							<i class="fas fa-tachometer-alt mr-3 w-5 text-center"></i>
							대시보드
						</a>

						<!-- 사용자 유형별 모바일 메뉴 아이템 -->
						{#if user?.userType === USER_TYPES.DEVELOPER}
							<!-- 개발자용 메뉴 -->
							<a
								href="/dashboard/clients"
								class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
								onclick={() => (mobileMenuOpen = false)}
							>
								<i class="fas fa-cubes mr-3 w-5 text-center"></i>
								내 애플리케이션
							</a>
							<a
								href="/dashboard/oauth-tester"
								class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
								onclick={() => (mobileMenuOpen = false)}
							>
								<i class="fas fa-flask mr-3 w-5 text-center"></i>
								OAuth2 테스터
							</a>
						{:else}
							<!-- 일반 사용자용 메뉴 -->
							<a
								href="/dashboard/profile"
								class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
								onclick={() => (mobileMenuOpen = false)}
							>
								<i class="fas fa-user mr-3 w-5 text-center"></i>
								프로필
							</a>
						{/if}

						<a
							href="/dashboard/profile"
							class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
							onclick={() => (mobileMenuOpen = false)}
						>
							<i class="fas fa-user mr-3 w-5 text-center"></i>
							프로필
						</a>
						<a
							href="/dashboard/settings"
							class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
							onclick={() => (mobileMenuOpen = false)}
						>
							<i class="fas fa-cog mr-3 w-5 text-center"></i>
							설정
						</a>
						<button
							onclick={() => {
								handleLogout();
								mobileMenuOpen = false;
							}}
							class="flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
						>
							<i class="fas fa-sign-out-alt mr-3 w-5 text-center"></i>
							로그아웃
						</button>
					</div>
				{:else}
					<!-- 비로그인 상태 메뉴 -->
					<div class="py-2">
						<a
							href="/auth/login"
							class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
							onclick={() => (mobileMenuOpen = false)}
						>
							<i class="fas fa-sign-in-alt mr-3 w-5 text-center"></i>
							로그인
						</a>
						<a
							href="/auth/register"
							class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
							onclick={() => (mobileMenuOpen = false)}
						>
							<i class="fas fa-user-plus mr-3 w-5 text-center"></i>
							회원가입
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>

<style>
	/* 백드롭 블러 효과 */
	.backdrop-blur-md {
		backdrop-filter: blur(12px);
	}

	.bg-white\/80 {
		background-color: rgba(255, 255, 255, 0.8);
	}

	/* 스켈레톤 애니메이션 개선 */
	@keyframes skeleton-shimmer {
		0% {
			background-position: -200px 0;
		}
		100% {
			background-position: calc(200px + 100%) 0;
		}
	}

	.skeleton-shimmer {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200px 100%;
		animation: skeleton-shimmer 1.5s infinite;
	}

	/* Custom shadow for dropdowns */
	.dropdown-shadow {
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	/* Reset button styles */
	.reset-button {
		border: none;
		padding: 0;
		margin: 0;
		background: none;
		cursor: pointer;
	}
</style>
