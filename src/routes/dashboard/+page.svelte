<script lang="ts">
	import { Card, Button } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

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

	// 토스트 테스트 함수들
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
</script>

<svelte:head>
	<title>대시보드 - FlowAuth</title>
</svelte:head>

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
