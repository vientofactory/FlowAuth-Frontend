<script lang="ts">
	import { authStore, authState, Button } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

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
	let profileDropdownOpen = $state(false);
	let unsubscribe: (() => void) | null = null;
	let initialAuthCheckDone = $state(false); // 초기 인증 확인 완료 여부

	onMount(() => {
		// 초기 인증 상태를 localStorage에서 직접 확인
		const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
		const hasToken = !!(token && token.trim() !== '');
		isAuthenticated = hasToken;
		initialAuthCheckDone = true;

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isAuthenticated = state.isAuthenticated;
			_isLoading = state.isLoading;
		});

		// 드롭다운 외부 클릭 시 닫기
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest('.profile-dropdown')) {
				profileDropdownOpen = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	function handleLogout() {
		profileDropdownOpen = false;
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}
</script>

<!-- 네비게이션 바 -->
<header
	class="sticky top-0 z-50 border-b {transparent
		? 'border-gray-200/50 bg-white/80 backdrop-blur-md'
		: 'border-gray-200 bg-white shadow-sm'}"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- 로고 -->
			<a href="/" class="flex cursor-pointer items-center">
				<img src="/logo_1.png" alt="FlowAuth Logo" class="h-8 w-auto object-contain rounded">
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
					<!-- 로그인 상태: 대시보드 버튼 -->
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
						<div class="profile-dropdown relative">
							<button
								class="flex items-center space-x-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								onclick={() => (profileDropdownOpen = !profileDropdownOpen)}
							>
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
									<span class="text-sm font-medium text-blue-800">
										{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
									</span>
								</div>
								<span class="hidden lg:block">{user?.firstName} {user?.lastName}</span>
								<i class="fas fa-chevron-down text-xs"></i>
							</button>

							<!-- 프로필 드롭다운 메뉴 -->
							{#if profileDropdownOpen}
								<div
									class="ring-opacity-5 absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black focus:outline-none"
								>
									<div class="border-b border-gray-200 px-4 py-2">
										<p class="text-sm font-medium text-gray-900">
											{user?.firstName}
											{user?.lastName}
										</p>
										<p class="text-xs text-gray-500">{user?.email}</p>
									</div>
									<a
										href="/dashboard/profile"
										class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										<i class="fas fa-user mr-2"></i>
										프로필
									</a>
									<a
										href="/dashboard/settings"
										class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										<i class="fas fa-cog mr-2"></i>
										설정
									</a>
									<div class="border-t border-gray-200"></div>
									<button
										onclick={handleLogout}
										class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
									>
										<i class="fas fa-sign-out-alt mr-2"></i>
										로그아웃
									</button>
								</div>
							{/if}
						</div>
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
					<button
						class="profile-dropdown flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 transition-colors duration-200 {profileDropdownOpen
							? 'ring-2 ring-blue-300'
							: ''}"
						onclick={() => (profileDropdownOpen = !profileDropdownOpen)}
						aria-expanded={profileDropdownOpen}
						aria-label="프로필 메뉴"
					>
						<span class="text-sm font-medium">
							{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
						</span>
					</button>
				{:else}
					<!-- 비로그인 상태: 햄버거 메뉴 -->
					<button class="text-gray-600 hover:text-blue-600" aria-label="메뉴 열기">
						<i class="fas fa-bars text-xl"></i>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- 모바일 드롭다운 메뉴 -->
	{#if profileDropdownOpen && isAuthenticated}
		<div class="border-t border-gray-200 bg-white md:hidden">
			<div class="px-4 py-3">
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
				<div class="mt-3 space-y-1">
					<a
						href="/dashboard"
						class="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						<i class="fas fa-tachometer-alt mr-2"></i>
						대시보드
					</a>
					<a
						href="/dashboard/profile"
						class="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						<i class="fas fa-user mr-2"></i>
						프로필
					</a>
					<a
						href="/dashboard/settings"
						class="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						<i class="fas fa-cog mr-2"></i>
						설정
					</a>
					<button
						onclick={handleLogout}
						class="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						<i class="fas fa-sign-out-alt mr-2"></i>
						로그아웃
					</button>
				</div>
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
</style>
