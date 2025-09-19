<script lang="ts">
	import { authState, Navigation } from '$lib';
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
		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		// 현재 경로 구독
		const pathUnsubscribe = page.subscribe(($page) => {
			currentPath = $page.url.pathname;
		});

		// 키보드 이벤트 리스너 추가
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			pathUnsubscribe();
			document.removeEventListener('keydown', handleKeyDown);
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
		return currentPath === href || (href !== '/dashboard' && currentPath.startsWith(href));
	}

	// 키보드 이벤트 핸들러
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			mobileMenuOpen = false;
		}
	}

	// 모바일 메뉴 항목 선택 함수
	function getMobileMenuItems() {
		const selectedItems = [
			dashboardMenuItems[0], // 개요
			dashboardMenuItems[1], // 클라이언트 관리
			dashboardMenuItems[3], // OAuth 테스터
			dashboardMenuItems[4], // 프로필
			dashboardMenuItems[5] // 설정
		];

		// 모바일용 짧은 라벨 추가
		return selectedItems.map((item) => ({
			...item,
			mobileLabel: getMobileLabel(item.id)
		}));
	}

	// 모바일용 짧은 라벨 생성
	function getMobileLabel(id: string): string {
		const labels: Record<string, string> = {
			dashboard: '홈',
			clients: '클라이언트',
			'oauth-tester': '테스터',
			profile: '프로필',
			settings: '설정'
		};
		return labels[id] || '메뉴';
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
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50"
	>
		<div class="text-center">
			<!-- 로딩 애니메이션 컨테이너 -->
			<div class="relative mb-8">
				<!-- 외부 링 -->
				<div
					class="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
				></div>
				<!-- 내부 링 -->
				<div
					class="absolute inset-0 mx-auto h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-indigo-500"
					style="animation-duration: 0.8s; animation-direction: reverse;"
				></div>
				<!-- 중앙 로고 이미지 -->
				<div class="absolute inset-0 flex items-center justify-center">
					<img
						src="/logo_icon.png"
						alt="FlowAuth 로고"
						class="h-12 w-12 animate-pulse object-contain"
					/>
				</div>
			</div>

			<!-- 로딩 텍스트 -->
			<div class="space-y-2">
				<h2 class="text-2xl font-bold text-gray-900">FlowAuth</h2>
				<p class="animate-pulse text-lg font-medium text-gray-600">대시보드를 준비하는 중...</p>
				<div class="mt-4 flex justify-center space-x-1">
					<div class="bounce-delay-0 h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
					<div class="bounce-delay-150 h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
					<div class="bounce-delay-300 h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
				</div>
			</div>
		</div>
	</div>

	<style>
		@keyframes loading-bar {
			0% {
				width: 0%;
			}
			50% {
				width: 80%;
			}
			100% {
				width: 60%;
			}
		}

		/* Bounce animation delays */
		.bounce-delay-0 {
			animation-delay: 0ms;
		}
		.bounce-delay-150 {
			animation-delay: 150ms;
		}
		.bounce-delay-300 {
			animation-delay: 300ms;
		}

		/* Mobile menu backdrop */
		.mobile-backdrop {
			background-color: rgba(0, 0, 0, 0.1);
			z-index: 40;
		}

		/* Mobile dropdown shadow */
		.mobile-dropdown-shadow {
			box-shadow:
				0 20px 25px -5px rgba(0, 0, 0, 0.1),
				0 10px 10px -5px rgba(0, 0, 0, 0.04);
			background-color: #ffffff;
			z-index: 50;
		}

		/* Mobile menu navigation background */
		.mobile-nav-bg {
			background-color: #ffffff;
		}

		/* Active menu item colors */
		.menu-item-active {
			background-color: #eff6ff;
			color: #1e3a8a;
		}

		.menu-item-inactive {
			background-color: transparent;
			color: #374151;
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
						class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none active:scale-95"
						aria-label="메뉴 열기"
						aria-expanded={mobileMenuOpen}
					>
						<i class="fas fa-bars text-lg"></i>
					</button>
				</div>
			</div>

			<!-- 모바일 메뉴 드롭다운 -->
			{#if mobileMenuOpen}
				<!-- 백드롭 - 투명한 배경 -->
				<div
					class="mobile-backdrop fixed inset-0 top-16 z-40 bg-transparent transition-opacity duration-300 ease-out {mobileMenuOpen
						? 'opacity-100'
						: 'pointer-events-none opacity-0'}"
					onclick={() => (mobileMenuOpen = false)}
					onkeydown={(e) => {
						if (e.key === 'Escape') mobileMenuOpen = false;
					}}
					role="button"
					tabindex="0"
					aria-label="메뉴 닫기"
				></div>

				<!-- 드롭다운 메뉴 -->
				<div
					class="mobile-dropdown-shadow absolute top-full right-0 left-0 z-50 transform border-t border-gray-200 bg-white shadow-xl transition-all duration-300 ease-out {mobileMenuOpen
						? 'translate-y-0 opacity-100'
						: 'pointer-events-none -translate-y-2 opacity-0'}"
				>
					<nav class="mobile-nav-bg max-h-96 overflow-y-auto px-2 py-4" aria-label="모바일 메뉴">
						<div class="space-y-2">
							{#each dashboardMenuItems as item (item.href)}
								<a
									href={item.href}
									class="group flex transform items-center rounded-xl px-4 py-4 text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]
										{isMenuActive(item.href)
										? 'menu-item-active border border-blue-200 bg-blue-50 text-blue-900 shadow-md'
										: 'menu-item-inactive text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'}"
									onclick={() => (mobileMenuOpen = false)}
									role="menuitem"
									aria-current={isMenuActive(item.href) ? 'page' : undefined}
								>
									<div
										class="mr-4 flex h-10 w-10 transform items-center justify-center rounded-lg transition-all duration-200 ease-out group-hover:scale-110
										{isMenuActive(item.href)
											? 'bg-blue-100 text-blue-600 shadow-sm'
											: 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}"
									>
										<i
											class="{item.icon} text-lg transition-transform duration-200 group-hover:scale-110"
										></i>
									</div>
									<div class="flex-1">
										<div class="font-semibold">{item.label}</div>
										<div class="mt-0.5 text-xs text-gray-500">{item.description}</div>
									</div>
									{#if isMenuActive(item.href)}
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 shadow-sm"
										>
											<i class="fas fa-check text-xs text-blue-600"></i>
										</div>
									{:else}
										<i
											class="fas fa-chevron-right text-sm text-gray-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-gray-600"
										></i>
									{/if}
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
		<div
			class="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm lg:hidden"
		>
			<nav class="flex items-center justify-around px-1 py-1" aria-label="모바일 하단 메뉴">
				{#each getMobileMenuItems() as item (item.href)}
					<a
						href={item.href}
						class="group relative flex flex-col items-center justify-center rounded-xl px-3 py-3 text-xs font-medium transition-all duration-300 ease-out focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
							{isMenuActive(item.href)
							? 'scale-105 bg-blue-500 text-white shadow-lg'
							: 'text-gray-600 hover:scale-105 hover:bg-gray-50 hover:text-gray-900 active:scale-95'}"
						aria-current={isMenuActive(item.href) ? 'page' : undefined}
						aria-label="{item.label} 메뉴"
					>
						<!-- 활성 상태 배경 효과 -->
						{#if isMenuActive(item.href)}
							<div class="absolute inset-0 animate-pulse rounded-xl bg-blue-500 opacity-10"></div>
						{/if}

						<!-- 아이콘 -->
						<div class="relative mb-1">
							<i class="{item.icon} h-5 w-5 transition-transform duration-200 group-hover:scale-110"
							></i>
							{#if isMenuActive(item.href)}
								<div
									class="absolute -top-1 -right-1 h-2 w-2 animate-ping rounded-full bg-white"
								></div>
								<div class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white"></div>
							{/if}
						</div>

						<!-- 텍스트 -->
						<span class="text-center leading-tight font-semibold tracking-wide">
							{item.mobileLabel || item.label}
						</span>

						<!-- 호버 효과 -->
						{#if !isMenuActive(item.href)}
							<div
								class="absolute inset-0 rounded-xl bg-gradient-to-t from-gray-100 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							></div>
						{/if}
					</a>
				{/each}
			</nav>
		</div>

		<!-- 모바일 하단 네비게이션용 여백 -->
		<div class="h-20 lg:hidden"></div>

		<!-- 푸터 -->
		<Footer />
	</div>
{/if}
