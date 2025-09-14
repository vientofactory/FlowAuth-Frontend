<script lang="ts">
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import { Button } from '$lib';
	import type { User } from '$lib';

	interface Props {
		children: import('svelte').Snippet;
		title?: string;
		description?: string;
		showBackButton?: boolean;
		backUrl?: string;
		headerActions?: import('svelte').Snippet;
	}

	let { 
		children, 
		title = '대시보드', 
		description = '', 
		showBackButton = false, 
		backUrl = '/dashboard',
		headerActions
	}: Props = $props();

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	const toast = useToast();

	onMount(async () => {
		await authStore.initialize();

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});
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

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	function goBack() {
		window.location.href = backUrl;
	}

	// 사이드바 메뉴 아이템들
	const menuItems = [
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

	// 현재 경로에 따른 활성 메뉴 아이템 결정
	let currentPath = $state('');
	
	onMount(() => {
		currentPath = window.location.pathname;
	});
</script>

<svelte:head>
	<title>{title} - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="text-center">
			<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
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
				<Button onclick={() => (window.location.href = '/auth/login')}>
					로그인하기
				</Button>
			</div>
		</div>
	</div>
{:else if user}
	<div class="min-h-screen bg-gray-50">
		<!-- 헤더 -->
		<header class="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<div class="flex-shrink-0">
							<h1 class="text-xl font-bold text-gray-900">
								<i class="fas fa-shield-alt mr-2 text-blue-600"></i>
								FlowAuth
							</h1>
						</div>
						{#if showBackButton}
							<Button
								variant="outline"
								size="sm"
								onclick={goBack}
								class="text-gray-600 hover:text-gray-900"
							>
								<i class="fas fa-arrow-left mr-2"></i>
								뒤로
							</Button>
						{/if}
					</div>
					
					<div class="flex items-center space-x-4">
						{#if headerActions}
							{@render headerActions()}
						{/if}
						
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

		<div class="flex">
			<!-- 사이드바 -->
			<aside class="hidden w-64 bg-white shadow-sm lg:block">
				<nav class="mt-5 px-2">
					<div class="space-y-1">
						{#each menuItems as item}
							<a
								href={item.href}
								class="group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors duration-150 ease-in-out
									{currentPath.startsWith(item.href) 
										? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500' 
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
									}"
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
					{#if title || description}
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

		<!-- 모바일 네비게이션 (하단 고정) -->
		<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden">
			<div class="grid grid-cols-3 gap-1 px-2 py-2">
				{#each menuItems.slice(0, 6) as item}
					<a
						href={item.href}
						class="flex flex-col items-center justify-center rounded-md px-1 py-2 text-xs transition-colors duration-150 ease-in-out
							{currentPath.startsWith(item.href) 
								? 'bg-blue-100 text-blue-900' 
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
							}"
					>
						<i class="{item.icon} mb-1 text-lg"></i>
						<span class="truncate font-medium">{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>

		<!-- 모바일에서 하단 네비게이션을 위한 여백 -->
		<div class="h-16 lg:hidden"></div>
	</div>
{/if}