<script lang="ts">
	import { Card, useToast, apiClient } from '$lib';
	import { useFieldValidation, useFormValidation, validators } from '$lib';
	import type { CreateUserDto } from '$lib';
	import { goto } from '$app/navigation';
	import { USER_TYPES } from '$lib/types/user.types';
	import { env } from '$lib/config/env';
	import { onMount } from 'svelte';
	import { load, type ReCaptchaInstance } from 'recaptcha-v3';

	// 컴포넌트 import
	import RegisterStepIndicator from '$lib/components/auth/RegisterStepIndicator.svelte';
	import RegisterBasicInfoStep from '$lib/components/auth/RegisterBasicInfoStep.svelte';
	import RegisterAccountInfoStep from '$lib/components/auth/RegisterAccountInfoStep.svelte';
	import RegisterPasswordStep from '$lib/components/auth/RegisterPasswordStep.svelte';
	import RegisterTermsStep from '$lib/components/auth/RegisterTermsStep.svelte';
	import RegisterNavigation from '$lib/components/auth/RegisterNavigation.svelte';

	// 회원가입 단계 정의
	const RegisterStep = {
		BASIC_INFO: 1,
		ACCOUNT_INFO: 2,
		PASSWORD_SETUP: 3,
		TERMS_AGREEMENT: 4
	} as const;

	type RegisterStepType = (typeof RegisterStep)[keyof typeof RegisterStep];

	// 현재 단계 상태
	let currentStep = $state<RegisterStepType>(RegisterStep.BASIC_INFO);
	let isStepTransitioning = $state(false);

	// 폼 검증 필드들
	const emailField = useFieldValidation('', validators.email);
	const passwordField = useFieldValidation('', validators.password);
	const confirmPasswordField = useFieldValidation('', (value: string) => {
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

	// 비밀번호 요구사항 상태
	let passwordRequirements = $derived({
length: passwordField.value.length >= 8,
		lowercase: /(?=.*[a-z])/.test(passwordField.value),
		uppercase: /(?=.*[A-Z])/.test(passwordField.value),
		number: /(?=.*\d)/.test(passwordField.value),
		specialChar: /(?=.*[@$!%*?&])/.test(passwordField.value)
	});

	// 전체 비밀번호 검증 상태
	let isPasswordValid = $derived(Object.values(passwordRequirements).every(Boolean));
	let isConfirmPasswordValid = $derived(
confirmPasswordField.value && passwordField.value === confirmPasswordField.value
	);

	// 사용자 타입 및 약관 상태
	let userType = $state(USER_TYPES.REGULAR);
	let isLoading = $state(false);
	let termsAccepted = $state(false);
	let privacyAccepted = $state(false);
	let recaptchaToken = $state('');
	let recaptchaInstance: ReCaptchaInstance | null = null;

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

	// 단계별 검증 상태
	function isCurrentStepValid(): boolean {
		switch (currentStep) {
			case RegisterStep.BASIC_INFO:
				return (
firstNameField.value.trim() !== '' &&
					firstNameField.value.trim().length >= 2 &&
					lastNameField.value.trim() !== '' &&
					lastNameField.value.trim().length >= 2
				);
			case RegisterStep.ACCOUNT_INFO: {
				const isUsernameValid =
					usernameField.value.trim() !== '' &&
					usernameField.value.trim().length >= 3 &&
					/^[a-zA-Z0-9_]+$/.test(usernameField.value.trim()) &&
					usernameField.error === '';
				const isEmailValid =
					emailField.value.trim() !== '' &&
					/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim()) &&
					emailField.error === '';
				return isUsernameValid && isEmailValid;
			}
			case RegisterStep.PASSWORD_SETUP:
				return (
isPasswordValid &&
					Boolean(isConfirmPasswordValid) &&
					passwordField.value === confirmPasswordField.value
				);
			case RegisterStep.TERMS_AGREEMENT:
				return termsAccepted && privacyAccepted;
			default:
				return false;
		}
	}

	// 현재 단계의 유효성 상태
	let currentStepValid = $derived(isCurrentStepValid());

	// 단계별 검증 함수
	function validateCurrentStep(): boolean {
		switch (currentStep) {
			case RegisterStep.BASIC_INFO:
				return firstNameField.value.trim() !== '' && lastNameField.value.trim() !== '';
			case RegisterStep.ACCOUNT_INFO:
				return usernameField.validate() && emailField.validate();
			case RegisterStep.PASSWORD_SETUP:
				return isPasswordValid && Boolean(isConfirmPasswordValid);
			case RegisterStep.TERMS_AGREEMENT:
				return termsAccepted && privacyAccepted;
			default:
				return false;
		}
	}

	// 다음 단계로 이동
	async function nextStep() {
		if (!validateCurrentStep()) {
			if (currentStep === RegisterStep.BASIC_INFO) {
				toast.warning('이름과 성을 모두 입력해주세요.');
			} else if (currentStep === RegisterStep.ACCOUNT_INFO) {
				toast.warning('사용자 이름과 이메일을 올바르게 입력해주세요.');
			} else if (currentStep === RegisterStep.PASSWORD_SETUP) {
				toast.warning('비밀번호 요구사항을 모두 만족해야 합니다.');
			} else if (currentStep === RegisterStep.TERMS_AGREEMENT) {
				toast.warning('필수 약관에 동의해주세요.');
			}
			return;
		}

		if (currentStep < RegisterStep.TERMS_AGREEMENT) {
			isStepTransitioning = true;
			setTimeout(() => {
				currentStep += 1;
				isStepTransitioning = false;
			}, 150);
		}
	}

	// 이전 단계로 이동
	function prevStep() {
		if (currentStep > RegisterStep.BASIC_INFO) {
			isStepTransitioning = true;
			setTimeout(() => {
				currentStep -= 1;
				isStepTransitioning = false;
			}, 150);
		}
	}

	// 키보드 이벤트 핸들러
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && currentStepValid && !isLoading) {
			if (currentStep === RegisterStep.TERMS_AGREEMENT) {
				handleRegister();
			} else {
				nextStep();
			}
		}
	}

	async function handleRegister() {
		// 마지막 단계에서만 실제 회원가입 진행
		if (currentStep !== RegisterStep.TERMS_AGREEMENT) {
			nextStep();
			return;
		}

		// 모든 필드 검증 수행
		if (!form.validateAll()) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		// 필수 약관 동의 확인
		if (!termsAccepted || !privacyAccepted) {
			toast.warning('필수 약관에 동의해주세요.');
			return;
		}

		// reCAPTCHA 검증
		if (!env.RECAPTCHA_SITE_KEY) {
			toast.error('reCAPTCHA가 설정되지 않았습니다. 관리자에게 문의해주세요.');
			return;
		}
		if (!recaptchaInstance) {
			toast.error('reCAPTCHA가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
			return;
		}
		try {
			recaptchaToken = await recaptchaInstance.execute('register');
		} catch {
			toast.error('reCAPTCHA 검증에 실패했습니다. 다시 시도해주세요.');
			return;
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
				recaptchaToken: recaptchaToken
			};

			await apiClient.register(userData);
			toast.success('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
			await goto('/auth/login');
		} catch (error: any) {
			const message = error.message || '회원가입 중 오류가 발생했습니다.';
			toast.error(message);
		} finally {
			isLoading = false;
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

	<div class="w-full max-w-md sm:max-w-lg lg:max-w-2xl">
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
			<!-- 진행 상황 표시 -->
			<RegisterStepIndicator {currentStep} totalSteps={4} {currentStepValid} />

			<form
				onsubmit={handleRegister}
				class="min-h-[400px] space-y-4 transition-all duration-300"
				class:opacity-50={isStepTransitioning}
			>
				<!-- 단계별 컴포넌트 -->
				{#if currentStep === RegisterStep.BASIC_INFO}
					<div class="animate-in slide-in-from-right-4 duration-300">
						<RegisterBasicInfoStep
							{firstNameField}
							{lastNameField}
							bind:userType
							{isLoading}
							onKeyPress={handleKeyPress}
						/>
					</div>
				{:else if currentStep === RegisterStep.ACCOUNT_INFO}
					<div class="animate-in slide-in-from-right-4 duration-300">
						<RegisterAccountInfoStep
							{usernameField}
							{emailField}
							{isLoading}
							onKeyPress={handleKeyPress}
						/>
					</div>
				{:else if currentStep === RegisterStep.PASSWORD_SETUP}
					<div class="animate-in slide-in-from-right-4 duration-300">
						<RegisterPasswordStep
							{passwordField}
							{confirmPasswordField}
							{passwordRequirements}
							{isLoading}
							onKeyPress={handleKeyPress}
						/>
					</div>
				{:else if currentStep === RegisterStep.TERMS_AGREEMENT}
					<div class="animate-in slide-in-from-right-4 duration-300">
						<RegisterTermsStep
							bind:termsAccepted
							bind:privacyAccepted
							{isLoading}
							firstName={firstNameField.value}
							lastName={lastNameField.value}
							username={usernameField.value}
							email={emailField.value}
							{userType}
						/>
					</div>
				{/if}

				<!-- 네비게이션 버튼 -->
				<RegisterNavigation
					{currentStep}
					totalSteps={4}
					canGoNext={currentStepValid}
					{isLoading}
					onPrevious={prevStep}
					onNext={nextStep}
					onSubmit={handleRegister}
				/>
			</form>
		</Card>

		<!-- 하단 링크 -->
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600">
				이미 계정이 있으신가요?
				<a
					href="/auth/login"
					class="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500"
				>
					로그인하기
				</a>
			</p>
		</div>
	</div>
</div>
