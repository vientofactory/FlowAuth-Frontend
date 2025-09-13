<script lang="ts">
	import { Card, Button, Input } from '$lib';
	import { apiClient } from '$lib';
	import type { CreateUserDto } from '$lib';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let agreeToTerms = $state(false);

	async function handleRegister() {
		if (!email || !password || !confirmPassword) {
			error = '모든 필드를 입력해주세요.';
			return;
		}

		if (password !== confirmPassword) {
			error = '비밀번호가 일치하지 않습니다.';
			return;
		}

		if (password.length < 8) {
			error = '비밀번호는 최소 8자 이상이어야 합니다.';
			return;
		}

		if (!agreeToTerms) {
			error = '이용약관에 동의해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const userData: CreateUserDto = { email, password };
			const result = await apiClient.register(userData);

			// 회원가입 성공 - 로그인 페이지로 리다이렉트
			console.log('Registration successful:', result);
			window.location.href = '/auth/login?message=회원가입이 완료되었습니다. 로그인해주세요.';
		} catch (err) {
			error = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleRegister();
		}
	}
</script>

<svelte:head>
	<title>회원가입 - FlowAuth</title>
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
				<i class="fas fa-user-plus text-2xl text-white"></i>
			</div>
			<h1
				class="gradient-text mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent"
			>
				FlowAuth
			</h1>
			<p class="text-lg text-gray-600">새 계정 만들기</p>
		</div>

		<Card class="card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-2xl font-bold text-gray-900">회원가입</h2>
				<p class="text-gray-600">새 계정을 만들어 FlowAuth를 시작하세요</p>
			</div>

			<form onsubmit={handleRegister} class="space-y-6">
				{#if error}
					<div
						class="animate-fade-in rounded-r-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-red-700"
					>
						<div class="flex items-center">
							<i class="fas fa-exclamation-triangle mr-2"></i>
							<span class="font-medium">회원가입 실패</span>
						</div>
						<p class="mt-1 text-sm">{error}</p>
					</div>
				{/if}

				<div class="space-y-5">
					<div class="relative">
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
							<i class="fas fa-envelope mr-2 text-blue-500"></i>
							이메일 주소
						</label>
						<Input
							type="email"
							placeholder="your@email.com"
							value={email}
							oninput={(e: Event) => (email = (e.target as HTMLInputElement).value)}
							required
							disabled={isLoading}
							class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">이메일 주소는 계정 복구에 사용됩니다</p>
					</div>

					<div class="relative">
						<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
							<i class="fas fa-lock mr-2 text-blue-500"></i>
							비밀번호
						</label>
						<Input
							type="password"
							placeholder="비밀번호를 입력하세요"
							value={password}
							oninput={(e: Event) => (password = (e.target as HTMLInputElement).value)}
							required
							disabled={isLoading}
							class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">최소 8자 이상, 대소문자 및 숫자 포함 권장</p>
					</div>

					<div class="relative">
						<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
							<i class="fas fa-lock mr-2 text-blue-500"></i>
							비밀번호 확인
						</label>
						<Input
							type="password"
							placeholder="비밀번호를 다시 입력하세요"
							value={confirmPassword}
							oninput={(e: Event) => (confirmPassword = (e.target as HTMLInputElement).value)}
							onkeydown={handleKeyPress}
							required
							disabled={isLoading}
							class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="space-y-4">
					<label class="flex items-start">
						<input
							type="checkbox"
							bind:checked={agreeToTerms}
							class="focus:ring-opacity-50 mt-0.5 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
							disabled={isLoading}
						/>
						<span class="ml-2 text-sm text-gray-600">
							<a
								href="/terms"
								data-sveltekit-preload-data
								class="font-medium text-blue-600 hover:text-blue-500">이용약관</a
							>
							및
							<a
								href="/privacy"
								data-sveltekit-preload-data
								class="font-medium text-blue-600 hover:text-blue-500">개인정보처리방침</a
							>에 동의합니다
						</span>
					</label>
				</div>

				<Button
					variant="primary"
					type="submit"
					disabled={isLoading || !agreeToTerms}
					class="w-full transform py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
				>
					{#if isLoading}
						<div class="flex items-center justify-center">
							<i class="fas fa-spinner fa-spin mr-2"></i>
							회원가입 중...
						</div>
					{:else}
						<div class="flex items-center justify-center">
							<i class="fas fa-user-plus mr-2"></i>
							회원가입
						</div>
					{/if}
				</Button>
			</form>

			<!-- 소셜 회원가입 (추후 확장 가능) -->
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
					이미 계정이 있으신가요?
					<a
						href="/auth/login"
						data-sveltekit-preload-data
						class="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-500"
					>
						로그인
					</a>
				</p>
				<a
					href="/"
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
	.bg-grid-slate-100 {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5h32m-32 32h32m-32-32v32m32-32v32'/%3e%3c/svg%3e");
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	/* 입력 필드 포커스 효과 */
	input:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* 버튼 호버 효과 */
	/* button:hover {
    transform: translateY(-1px);
  } */

	/* 로딩 스피너 애니메이션 */
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.fa-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* 그라데이션 텍스트 애니메이션 */
	.gradient-text {
		background: linear-gradient(45deg, #3b82f6, #6366f1, #8b5cf6);
		background-size: 200% 200%;
		animation: gradient-shift 3s ease infinite;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
</style>
