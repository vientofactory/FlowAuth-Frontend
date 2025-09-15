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

	onMount(async () => {
		await authStore.initialize();

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
			const activeItem = dashboardMenuItems.find(item => isMenuActive(item.href));
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
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="text-lg font-medium text-gray-700">로딩 중...</p>
		</div>
	</div>
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

		<!-- 모바일 메뉴 버튼 -->
		<div class="lg:hidden">
			<div class="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
				<h1 class="text-xl font-bold text-gray-900">{title}</h1>
				<button
					onclick={toggleMobileMenu}
					class="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					aria-label="메뉴 열기"
				>
					<i class="fas fa-bars text-lg"></i>
				</button>
			</div>

			<!-- 모바일 메뉴 드롭다운 -->
			{#if mobileMenuOpen}
				<div class="bg-white shadow-lg">
					<nav class="px-2 py-3">
						<div class="space-y-1">
							{#each dashboardMenuItems as item (item.href)}
								<a
									href={item.href}
									class="block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-in-out
										{isMenuActive(item.href)
										? 'bg-blue-100 text-blue-900'
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
									onclick={() => (mobileMenuOpen = false)}
								>
									<i class="{item.icon} mr-3 h-5 w-5"></i>
									{item.label}
								</a>
							{/each}
						</div>
					</nav>
				</div>
			{/if}
		</div>

		<div class="flex">
			<!-- 대시보드 사이드바 -->
			<aside class="hidden w-64 bg-white shadow-sm lg:block">
				<nav class="mt-5 px-2">
					<div class="space-y-1">
						{#each dashboardMenuItems as item (item.href)}
							<a
								href={item.href}
								class="group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150 ease-in-out
									{isMenuActive(item.href)
									? 'border-r-2 border-blue-500 bg-blue-100 text-blue-900'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
							>
								<i class="{item.icon} mr-3 h-5 w-5 flex-shrink-0"></i>
								<div class="flex-1">
									<div class="text-sm font-medium">{item.label}</div>
									<div class="text-xs text-gray-500">{item.description}</div>
								</div>
							</a>
						{/each}
					</div>
				</nav>
			</aside>

			<!-- 메인 콘텐츠 -->
			<main class="flex-1">
				<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<!-- 페이지 헤더 -->
					{#if showPageHeader && (title || description)}
						<div class="mb-8">
							<div class="flex items-center justify-between">
								<div>
									<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
									{#if description}
										<p class="mt-2 text-lg text-gray-600">{description}</p>
									{/if}
								</div>
							</div>
						</div>
					{/if}

					<!-- 페이지 콘텐츠 -->
					{@render children()}
				</div>
			</main>
		</div>

		<!-- 푸터 -->
		<Footer />
	</div>
{/if}
