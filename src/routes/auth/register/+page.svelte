<script lang="ts">
	import { Card, FormField, LoadingButton, useToast, apiClient } from '$lib';
	import { useFieldValidation, useFormValidation, validators } from '$lib';
	import type { CreateUserDto } from '$lib';
	import { goto } from '$app/navigation';
	import { USER_TYPES } from '$lib/types/user.types';
	import { env } from '$lib/config/env';
	import { onMount } from 'svelte';
	import { load } from 'recaptcha-v3';

	// 폼 검증 필드들
	const emailField = useFieldValidation('', validators.email);
	const passwordField = useFieldValidation('', validators.password);
	const confirmPasswordField = useFieldValidation('', (value: string) => {
		// Access the current password value during validation, not at initialization
		return validators.confirmPassword(() => passwordField.value)(value);
	});
	const usernameField = useFieldValidation('', validators.username);
	const firstNameField = useFieldValidation('', validators.firstName);
	const lastNameField = useFieldValidation('', validators.lastName);

	const form = useFormValidation({
		email: emailField,
		password: passwordField,
		confirmPassword: confirmPasswordField,
		username: usernameField,
		firstName: firstNameField,
		lastName: lastNameField
	});

	let userType = $state(USER_TYPES.REGULAR); // 기본값: 일반 사용자
	let isLoading = $state(false);
	let agreeToTerms = $state(false);
	let recaptchaToken = $state('');
	let recaptchaInstance: unknown = null;

	// 중앙화된 토스트 훅 사용
	const toast = useToast();

	onMount(async () => {
		if (env.RECAPTCHA_SITE_KEY) {
			try {
				recaptchaInstance = await load(env.RECAPTCHA_SITE_KEY);
			} catch (error) {
				console.error('reCAPTCHA 초기화 실패:', error);
			}
		}
	});

	async function handleRegister() {
		// 모든 필드 검증 수행
		if (!form.validateAll()) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		// 이용약관 동의 확인
		if (!agreeToTerms) {
			toast.warning('이용약관에 동의해주세요.');
			return;
		}

		// reCAPTCHA 검증
		if (env.RECAPTCHA_SITE_KEY && recaptchaInstance) {
			try {
				recaptchaToken = await recaptchaInstance.execute('register');
			} catch {
				toast.error('reCAPTCHA 검증에 실패했습니다. 다시 시도해주세요.');
				return;
			}
		}

		isLoading = true;

		try {
			const userData: CreateUserDto = {
				email: emailField.value,
				password: passwordField.value,
				username: usernameField.value,
				firstName: firstNameField.value,
				lastName: lastNameField.value,
				userType,
				recaptchaToken: recaptchaToken || undefined
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
		<div class="mb-6 text-center sm:mb-8">
			<div class="inline-flex items-center">
				<img
					src="/logo_1.png"
					alt="FlowAuth Logo"
					class="h-12 w-auto rounded-2xl object-contain sm:h-16"
				/>
			</div>
			<p class="text-base text-gray-600 sm:text-lg">새 계정 만들기</p>
		</div>

		<Card class="animate-card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="mb-6 text-center sm:mb-8">
				<h2 class="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">회원가입</h2>
				<p class="text-sm text-gray-600 sm:text-base">새 계정을 만들어 FlowAuth를 시작하세요</p>
			</div>

			<form onsubmit={handleRegister} class="space-y-4 sm:space-y-5">
				<div class="space-y-3 sm:space-y-4">
					<!-- 사용자 이름과 이메일을 가로로 배치 -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							name="username"
							label="사용자 이름"
							placeholder="사용자 이름"
							type="text"
							required
							disabled={isLoading}
							hint="영문, 숫자, 밑줄만 사용"
							icon="fas fa-user"
							bind:value={usernameField.value}
							error={usernameField.error}
							oninput={() => usernameField.validate()}
						/>

						<FormField
							name="email"
							label="이메일 주소"
							placeholder="your@email.com"
							type="email"
							required
							disabled={isLoading}
							hint="계정 복구에 사용됩니다"
							icon="fas fa-envelope"
							bind:value={emailField.value}
							error={emailField.error}
							oninput={() => emailField.validate()}
						/>
					</div>

					<!-- 이름과 성을 가로로 배치 -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField
							name="firstName"
							label="이름"
							placeholder="이름"
							type="text"
							required
							disabled={isLoading}
							icon="fas fa-id-card"
							bind:value={firstNameField.value}
							error={firstNameField.error}
							oninput={() => firstNameField.validate()}
						/>

						<FormField
							name="lastName"
							label="성"
							placeholder="성"
							type="text"
							required
							disabled={isLoading}
							icon="fas fa-id-card"
							bind:value={lastNameField.value}
							error={lastNameField.error}
							oninput={() => lastNameField.validate()}
						/>
					</div>

					<!-- 사용자 유형 선택 -->
					<div class="relative">
						<fieldset class="mb-2">
							<legend class="mb-3 block text-sm font-medium text-gray-700">
								<i class="fas fa-user-tag mr-2 text-blue-500"></i>
								사용자 유형
							</legend>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<label
									class="flex cursor-pointer items-start rounded-lg border border-gray-200 p-3 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50"
								>
									<input
										type="radio"
										bind:group={userType}
										value={USER_TYPES.REGULAR}
										class="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
										disabled={isLoading}
									/>
									<div class="ml-3 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-900">일반 사용자</span>
											<span
												class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
											>
												기본
											</span>
										</div>
										<p class="mt-1 text-xs text-gray-600">OAuth2 인증만 사용</p>
									</div>
								</label>

								<label
									class="flex cursor-pointer items-start rounded-lg border border-gray-200 p-3 transition-colors duration-200 hover:border-green-300 hover:bg-green-50"
								>
									<input
										type="radio"
										bind:group={userType}
										value={USER_TYPES.DEVELOPER}
										class="mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
										disabled={isLoading}
									/>
									<div class="ml-3 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-900">개발자</span>
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
											>
												고급
											</span>
										</div>
										<p class="mt-1 text-xs text-gray-600">클라이언트 및 토큰 관리 기능 포함</p>
									</div>
								</label>
							</div>
						</fieldset>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							name="password"
							label="비밀번호"
							placeholder="비밀번호"
							type="password"
							required
							disabled={isLoading}
							hint="8자 이상, 대소문자+숫자"
							icon="fas fa-lock"
							bind:value={passwordField.value}
							error={passwordField.error}
							oninput={() => passwordField.validate()}
						/>

						<FormField
							name="confirmPassword"
							label="비밀번호 확인"
							placeholder="비밀번호 확인"
							type="password"
							required
							disabled={isLoading}
							icon="fas fa-lock"
							bind:value={confirmPasswordField.value}
							error={confirmPasswordField.error}
							oninput={() => confirmPasswordField.validate()}
							onkeydown={handleKeyPress}
						/>
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

				<LoadingButton
					variant="primary"
					type="submit"
					loading={isLoading}
					loadingText="회원가입 중..."
					disabled={!agreeToTerms}
					icon="fas fa-user-plus"
					class="w-full transform py-2.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
				>
					회원가입
				</LoadingButton>
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
