<script lang="ts">
	import { Card, Button, Input, useToast, apiClient } from '$lib';
	import type { CreateUserDto } from '$lib';
	import {
		validateEmail,
		validatePassword,
		validateUsername,
		validateName
	} from '$lib/utils/validation.utils';
	import { goto } from '$app/navigation';
	import { USER_TYPES } from '$lib/types/user.types';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let username = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let userType = $state(USER_TYPES.REGULAR); // 기본값: 일반 사용자
	let isLoading = $state(false);
	let agreeToTerms = $state(false);

	// 폼 검증 상태
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');
	let usernameError = $state('');
	let firstNameError = $state('');
	let lastNameError = $state('');

	// 중앙화된 토스트 훅 사용
	const toast = useToast();

	// 실시간 검증 함수들
	function validateEmailField() {
		const result = validateEmail(email);
		emailError = result.isValid ? '' : result.message || '';
	}

	function validatePasswordField() {
		const result = validatePassword(password);
		passwordError = result.isValid ? '' : result.message || '';
		validateConfirmPasswordField(); // 비밀번호 변경 시 확인 비밀번호도 재검증
	}

	function validateConfirmPasswordField() {
		if (!confirmPassword) {
			confirmPasswordError = '비밀번호 확인을 입력해주세요.';
			return;
		}
		if (password !== confirmPassword) {
			confirmPasswordError = '비밀번호가 일치하지 않습니다.';
		} else {
			confirmPasswordError = '';
		}
	}

	function validateUsernameField() {
		const result = validateUsername(username);
		usernameError = result.isValid ? '' : result.message || '';
	}

	function validateFirstNameField() {
		const result = validateName(firstName, '이름');
		firstNameError = result.isValid ? '' : result.message || '';
	}

	function validateLastNameField() {
		const result = validateName(lastName, '성');
		lastNameError = result.isValid ? '' : result.message || '';
	}

	async function handleRegister() {
		// 모든 필드 검증 수행
		validateEmailField();
		validatePasswordField();
		validateConfirmPasswordField();
		validateUsernameField();
		validateFirstNameField();
		validateLastNameField();

		// 이용약관 동의 확인
		if (!agreeToTerms) {
			toast.warning('이용약관에 동의해주세요.');
			return;
		}

		// 검증 실패 시 중단
		if (
			emailError ||
			passwordError ||
			confirmPasswordError ||
			usernameError ||
			firstNameError ||
			lastNameError
		) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		isLoading = true;

		try {
			const userData: CreateUserDto = {
				email,
				password,
				username,
				firstName,
				lastName,
				userType
			};

			await apiClient.register(userData);

			toast.success('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
			setTimeout(() => {
				goto('/auth/login');
			}, 2000);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
			toast.error(errorMessage);
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

	<div class="w-full max-w-md sm:max-w-lg lg:max-w-2xl xl:max-w-3xl">
		<!-- 로고 및 타이틀 -->
		<div class="mb-6 sm:mb-8 text-center">
			<div class="inline-flex items-center">
				<img src="/logo_1.png" alt="FlowAuth Logo" class="h-12 sm:h-16 w-auto rounded-2xl object-contain" />
			</div>
			<p class="text-base sm:text-lg text-gray-600">새 계정 만들기</p>
		</div>

		<Card class="animate-card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="mb-6 sm:mb-8 text-center">
				<h2 class="mb-2 text-xl sm:text-2xl font-bold text-gray-900">회원가입</h2>
				<p class="text-sm sm:text-base text-gray-600">새 계정을 만들어 FlowAuth를 시작하세요</p>
			</div>

			<form onsubmit={handleRegister} class="space-y-4 sm:space-y-5">
				<div class="space-y-3 sm:space-y-4">
					<!-- 사용자 이름과 이메일을 가로로 배치 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="relative">
							<label for="username" class="mb-2 block text-sm font-medium text-gray-700">
								<i class="fas fa-user mr-2 text-blue-500"></i>
								사용자 이름
							</label>
							<Input
								type="text"
								placeholder="사용자 이름"
								value={username}
								oninput={(e: Event) => (username = (e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							{#if usernameError}
								<p class="mt-1 text-sm text-red-600">{usernameError}</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500">영문, 숫자, 밑줄만 사용</p>
							{/if}
						</div>

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
							{#if emailError}
								<p class="mt-1 text-sm text-red-600">{emailError}</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500">계정 복구에 사용됩니다</p>
							{/if}
						</div>
					</div>

					<!-- 이름과 성을 가로로 배치 -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div class="relative">
							<label for="firstName" class="mb-2 block text-sm font-medium text-gray-700">
								<i class="fas fa-id-card mr-2 text-blue-500"></i>
								이름
							</label>
							<Input
								type="text"
								placeholder="이름"
								value={firstName}
								oninput={(e: Event) => (firstName = (e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							{#if firstNameError}
								<p class="mt-1 text-sm text-red-600">{firstNameError}</p>
							{/if}
						</div>

						<div class="relative">
							<label for="lastName" class="mb-2 block text-sm font-medium text-gray-700">
								<i class="fas fa-id-card mr-2 text-blue-500"></i>
								성
							</label>
							<Input
								type="text"
								placeholder="성"
								value={lastName}
								oninput={(e: Event) => (lastName = (e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							{#if lastNameError}
								<p class="mt-1 text-sm text-red-600">{lastNameError}</p>
							{/if}
						</div>
					</div>

					<!-- 사용자 유형 선택 -->
					<div class="relative">
						<fieldset class="mb-2">
							<legend class="mb-3 block text-sm font-medium text-gray-700">
								<i class="fas fa-user-tag mr-2 text-blue-500"></i>
								사용자 유형
							</legend>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<label class="flex items-start cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
									<input
										type="radio"
										bind:group={userType}
										value={USER_TYPES.REGULAR}
										class="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
										disabled={isLoading}
									/>
									<div class="ml-3 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-900">일반 사용자</span>
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
												기본
											</span>
										</div>
										<p class="text-xs text-gray-600 mt-1">
											OAuth2 인증만 사용
										</p>
									</div>
								</label>

								<label class="flex items-start cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
									<input
										type="radio"
										bind:group={userType}
										value={USER_TYPES.DEVELOPER}
										class="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
										disabled={isLoading}
									/>
									<div class="ml-3 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-900">개발자</span>
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
												고급
											</span>
										</div>
										<p class="text-xs text-gray-600 mt-1">
											클라이언트 및 토큰 관리 기능 포함
										</p>
									</div>
								</label>
							</div>
						</fieldset>
					</div>

					<!-- 비밀번호와 비밀번호 확인을 가로로 배치 -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="relative">
							<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
								<i class="fas fa-lock mr-2 text-blue-500"></i>
								비밀번호
							</label>
							<Input
								type="password"
								placeholder="비밀번호"
								value={password}
								oninput={(e: Event) => (password = (e.target as HTMLInputElement).value)}
								required
								disabled={isLoading}
								class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							{#if passwordError}
								<p class="mt-1 text-sm text-red-600">{passwordError}</p>
							{:else}
								<p class="mt-1 text-xs text-gray-500">8자 이상, 대소문자+숫자</p>
							{/if}
						</div>

						<div class="relative">
							<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
								<i class="fas fa-lock mr-2 text-blue-500"></i>
								비밀번호 확인
							</label>
							<Input
								type="password"
								placeholder="비밀번호 확인"
								value={confirmPassword}
								oninput={(e: Event) => (confirmPassword = (e.target as HTMLInputElement).value)}
								onkeydown={handleKeyPress}
								required
								disabled={isLoading}
								class="transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							/>
							{#if confirmPasswordError}
								<p class="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
							{/if}
						</div>
					</div>
				</div>

				<div class="space-y-3">
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
					class="w-full transform py-2.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
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
	/* 회원가입 페이지 전용 스타일만 유지 */
</style>
