<script lang="ts">
	import { authStore, authState, Navigation } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { User } from '$lib';

	interface Props {
		children: import('svelte').Snippet;
		title?: string;
		description?: string;
		showBackButton?: boolean;
		backUrl?: string;
		headerActions?: import('svelte').Snippet;
		showPageHeader?: boolean;
	}

	let {
		children,
		title = '대시보드',
		description = '',
		showBackButton = false,
		backUrl = '/dashboard',
		headerActions,
		showPageHeader = true
	}: Props = $props();

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;
	let currentPath = $state('');
	let mobileMenuOpen = $state(false);

	onMount(() => {
		authStore.initialize().catch(console.error);

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		// 현재 경로 구독
		const pathUnsubscribe = page.subscribe(($page) => {
			currentPath = $page.url.pathname;
		});

		return () => {
			pathUnsubscribe();
		};
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 현재 경로에 따른 자동 제목 설정
	$effect(() => {
		if (!title || title === '대시보드') {
			const activeItem = dashboardMenuItems.find((item) => isMenuActive(item.href));
			if (activeItem) {
				title = activeItem.label;
				description = activeItem.description;
			}
		}
	});

	function goBack() {
		window.location.href = backUrl;
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	// 메뉴 활성화 상태 확인 함수
	function isMenuActive(href: string): boolean {
		if (href === '/dashboard') {
			return currentPath === '/dashboard';
		}
		return currentPath.startsWith(href);
	}

	// 대시보드 메뉴 아이템들
	const dashboardMenuItems = [
		{
			id: 'dashboard',
			label: '개요',
			icon: 'fas fa-tachometer-alt',
			href: '/dashboard',
			description: '전체 현황 보기'
		},
		{
			id: 'clients',
			label: '클라이언트 관리',
			icon: 'fas fa-users',
			href: '/dashboard/clients',
			description: 'OAuth 클라이언트 관리'
		},
		{
			id: 'tokens',
			label: '토큰 관리',
			icon: 'fas fa-key',
			href: '/dashboard/tokens',
			description: '액세스 토큰 관리'
		},
		{
			id: 'oauth-tester',
			label: 'OAuth 테스터',
			icon: 'fas fa-link',
			href: '/dashboard/oauth-tester',
			description: 'OAuth 플로우 테스트'
		},
		{
			id: 'profile',
			label: '프로필',
			icon: 'fas fa-user',
			href: '/dashboard/profile',
			description: '사용자 프로필 관리'
		},
		{
			id: 'settings',
			label: '설정',
			icon: 'fas fa-cog',
			href: '/dashboard/settings',
			description: '시스템 설정'
		}
	];
</script>

<svelte:head>
	<title>{title} - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
		<div class="text-center">
			<!-- 로딩 애니메이션 컨테이너 -->
			<div class="relative mb-8">
				<!-- 외부 링 -->
				<div class="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
				<!-- 내부 링 -->
				<div class="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-indigo-500 mx-auto" style="animation-duration: 0.8s; animation-direction: reverse;"></div>
				<!-- 중앙 아이콘 -->
				<div class="absolute inset-0 flex items-center justify-center">
					<i class="fas fa-shield-alt text-blue-600 text-xl animate-pulse"></i>
				</div>
			</div>

			<!-- 로딩 텍스트 -->
			<div class="space-y-2">
				<h2 class="text-2xl font-bold text-gray-900">FlowAuth</h2>
				<p class="text-lg font-medium text-gray-600 animate-pulse">대시보드를 준비하는 중...</p>
				<div class="flex justify-center space-x-1 mt-4">
					<div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
					<div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
					<div class="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
				</div>
			</div>
		</div>
	</div>

	<style>
		@keyframes loading-bar {
			0% { width: 0%; }
			50% { width: 80%; }
			100% { width: 60%; }
		}
	</style>
{:else if !isAuthenticated}
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
			<div class="text-center">
				<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인증 필요</h2>
				<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
				<Button onclick={() => (window.location.href = '/auth/login')}>로그인하기</Button>
			</div>
		</div>
	</div>
{:else if user}
	<div class="min-h-screen bg-gray-50">
		<!-- 공통 네비게이션 -->
		<Navigation showDashboardButton={false} />

		<!-- 모바일 헤더 -->
		<div class="sticky top-0 z-40 bg-white shadow-sm lg:hidden">
			<div class="flex items-center justify-between px-4 py-3">
				<div class="flex items-center space-x-3">
					{#if showBackButton}
						<button
							onclick={goBack}
							class="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
							aria-label="뒤로 가기"
						>
							<i class="fas fa-arrow-left text-sm"></i>
						</button>
					{/if}
					<div>
						<h1 class="text-lg font-bold text-gray-900">{title}</h1>
						{#if description}
							<p class="text-xs text-gray-600">{description}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center space-x-2">
					{#if headerActions}
						{@render headerActions()}
					{/if}
					<button
						onclick={toggleMobileMenu}
						class="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
						aria-label="메뉴 열기"
					>
						<i class="fas fa-bars text-sm"></i>
					</button>
				</div>
			</div>

			<!-- 모바일 메뉴 드롭다운 -->
			{#if mobileMenuOpen}
				<div
					class="absolute top-full right-0 left-0 z-50 border-t border-gray-200 bg-white shadow-lg"
				>
					<nav class="max-h-96 overflow-y-auto px-2 py-3">
						<div class="space-y-1">
							{#each dashboardMenuItems as item (item.href)}
								<a
									href={item.href}
									class="flex items-center rounded-md px-3 py-3 text-sm font-medium transition-colors duration-150 ease-in-out
										{isMenuActive(item.href)
										? 'bg-blue-100 text-blue-900'
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
									onclick={() => (mobileMenuOpen = false)}
								>
									<i class="{item.icon} mr-3 h-5 w-5 flex-shrink-0"></i>
									<div>
										<div class="font-medium">{item.label}</div>
										<div class="text-xs text-gray-500">{item.description}</div>
									</div>
								</a>
							{/each}
						</div>
					</nav>
				</div>
			{/if}
		</div>

		<div class="flex">
			<!-- 데스크톱 사이드바 -->
			<aside
				class="hidden w-64 bg-white shadow-sm lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto"
			>
				<div class="p-6">
					<h2 class="text-lg font-semibold text-gray-900">대시보드</h2>
					<p class="text-sm text-gray-600">메뉴를 선택하세요</p>
				</div>
				<nav class="px-3">
					<div class="space-y-1">
						{#each dashboardMenuItems as item (item.href)}
							<a
								href={item.href}
								class="group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ease-in-out
									{isMenuActive(item.href)
									? 'bg-blue-100 text-blue-900 shadow-sm'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<i class="{item.icon} mr-3 h-5 w-5 flex-shrink-0"></i>
								<div class="flex-1">
									<div class="font-medium">{item.label}</div>
									<div class="text-xs text-gray-500">{item.description}</div>
								</div>
								{#if isMenuActive(item.href)}
									<div class="h-2 w-2 rounded-full bg-blue-600"></div>
								{/if}
							</a>
						{/each}
					</div>
				</nav>
			</aside>

			<!-- 메인 콘텐츠 -->
			<main class="min-h-screen flex-1">
				<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<!-- 데스크톱 페이지 헤더 -->
					{#if showPageHeader && (title || description)}
						<div class="mb-6 hidden lg:block">
							<div class="flex items-center justify-between">
								<div>
									<h1 class="text-2xl font-bold text-gray-900 lg:text-3xl">{title}</h1>
									{#if description}
										<p class="mt-1 text-sm text-gray-600 lg:mt-2 lg:text-lg">{description}</p>
									{/if}
								</div>
								{#if headerActions}
									<div class="flex items-center space-x-3">
										{@render headerActions()}
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- 페이지 콘텐츠 -->
					{@render children()}
				</div>
			</main>
		</div>

		<!-- 모바일 하단 네비게이션 -->
		<div class="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white lg:hidden">
			<nav class="flex items-center justify-around px-2 py-2">
				{#each dashboardMenuItems.slice(0, 5) as item (item.href)}
					<a
						href={item.href}
						class="flex flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200
							{isMenuActive(item.href)
							? 'bg-blue-100 text-blue-900'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<i class="{item.icon} mb-1 h-5 w-5"></i>
						<span class="text-center leading-tight">{item.label}</span>
					</a>
				{/each}
			</nav>
		</div>

		<!-- 모바일 하단 네비게이션용 여백 -->
		<div class="h-16 lg:hidden"></div>

		<!-- 푸터 -->
		<Footer />
	</div>
{/if}
