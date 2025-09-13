<script lang="ts">
	import { Card, Button, Input } from '$lib';
	import { authStore, useToast } from '$lib';
	import { MESSAGES, APP_CONSTANTS, ROUTES } from '$lib/constants/app.constants';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	// 중앙화된 토스트 훅 사용
	const toast = useToast();

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault(); // 폼 기본 동작 방지
		
		if (!email || !password) {
			toast.warning(MESSAGES.VALIDATION.EMAIL_PASSWORD_REQUIRED);
			return;
		}

		if (isLoading) return; // 중복 실행 방지

		isLoading = true;

		try {
			await authStore.login(email, password);
			toast.success(MESSAGES.VALIDATION.LOGIN_SUCCESS);

			// 리다이렉트
			setTimeout(() => {
				window.location.href = ROUTES.DASHBOARD;
			}, APP_CONSTANTS.REDIRECT_DELAY);
		} catch (err) {
			console.error('Login error:', err); // 디버깅용 로그 추가
			const errorMessage = err instanceof Error ? err.message : MESSAGES.VALIDATION.LOGIN_FAILED;
			toast.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isLoading) {
			// Enter 키는 폼의 기본 submit을 트리거하므로 특별한 처리 불필요
			// 폼의 onsubmit 이벤트가 처리함
		}
	}
</script>

<svelte:head>
	<title>로그인 - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12"
>
	<!-- 배경 패턴 -->
	<div
		class="bg-grid-slate-100 absolute inset-0 -z-10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
	></div>

	<div class="w-full max-w-md">
		<!-- 로고 및 타이틀 -->
		<div class="mb-8 text-center">
			<div
				class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
			>
				<i class="fas fa-shield-alt text-2xl text-white"></i>
			</div>
			<h1
				class="gradient-text mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent"
			>
				FlowAuth
			</h1>
			<p class="text-lg text-gray-600">오픈소스 OAuth2 시스템</p>
		</div>

		<Card class="animate-card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-2xl font-bold text-gray-900">로그인</h2>
				<p class="text-gray-600">계정에 로그인하여 서비스를 이용하세요</p>
			</div>

			<!-- SvelteKit 권장 방식의 폼 구조 -->
			<form method="POST" onsubmit={handleSubmit} class="space-y-6">
				<!-- 이메일 입력 -->
				<div class="relative">
					<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
						<i class="fas fa-envelope mr-2 text-blue-500"></i>
						이메일 주소
					</label>
					<Input
						type="email"
						id="email"
						name="email"
						placeholder="your@email.com"
						value={email}
						oninput={(e: Event) => (email = (e.target as HTMLInputElement).value)}
						onkeydown={handleKeyPress}
						disabled={isLoading}
						class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<!-- 비밀번호 입력 -->
				<div class="relative">
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
						<i class="fas fa-lock mr-2 text-blue-500"></i>
						비밀번호
					</label>
					<Input
						type="password"
						id="password"
						name="password"
						placeholder="비밀번호를 입력하세요"
						value={password}
						oninput={(e: Event) => (password = (e.target as HTMLInputElement).value)}
						onkeydown={handleKeyPress}
						disabled={isLoading}
						class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<!-- 추가 옵션 -->
				<div class="flex items-center justify-between">
					<label class="flex items-center">
						<input
							type="checkbox"
							name="remember"
							class="focus:ring-opacity-50 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
						/>
						<span class="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
					</label>
					<a
						href={ROUTES.FORGOT_PASSWORD}
						data-sveltekit-preload-data
						class="text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500"
					>
						비밀번호 찾기
					</a>
				</div>

				<!-- 로그인 버튼 -->
				<Button
					variant="primary"
					type="submit"
					disabled={isLoading}
					class="w-full transform py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
				>
					{#if isLoading}
						<div class="flex items-center justify-center">
							<i class="fas fa-spinner fa-spin mr-2"></i>
							로그인 중...
						</div>
					{:else}
						<div class="flex items-center justify-center">
							<i class="fas fa-sign-in-alt mr-2"></i>
							로그인
						</div>
					{/if}
				</Button>
			</form>

			<!-- 소셜 로그인 (추후 확장 가능) -->
			<!-- <div class="mt-8">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200">
            <i class="fab fa-google mr-2 text-red-500"></i>
            Google
          </button>
          <button class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200">
            <i class="fab fa-github mr-2"></i>
            GitHub
          </button>
        </div>
      </div> -->

			<div class="mt-8 space-y-2 text-center">
				<p class="text-gray-600">
					계정이 없으신가요?
					<a
						href={ROUTES.REGISTER}
						data-sveltekit-preload-data
						class="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-500"
					>
						회원가입
					</a>
				</p>
				<a
					href={ROUTES.HOME}
					data-sveltekit-preload-data
					class="inline-flex items-center text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700"
				>
					<i class="fas fa-arrow-left mr-1"></i>
					홈으로 돌아가기
				</a>
			</div>
		</Card>
	</div>
</div>

<style>
	/* 로그인 페이지 전용 스타일만 유지 */
</style>
