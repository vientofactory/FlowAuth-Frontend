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

	// RegisterAccountInfoStep 컴포넌트 참조
	interface ValidationResult {
		available: boolean;
		message: string;
	}

	let registerAccountInfoStep: {
		getValidationResults: () => {
			username: ValidationResult | null;
			email: ValidationResult | null;
		};
	} | null = $state(null);

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
				// 기본 필드 검증
				const hasUsernameValue =
					usernameField.value.trim() !== '' && usernameField.value.trim().length >= 3;
				const hasEmailValue =
					emailField.value.trim() !== '' &&
					/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim());
				const hasBasicFormat = /^[a-zA-Z0-9_]+$/.test(usernameField.value.trim());

				// 필수 조건: 값이 있고 형식이 올바르며 에러가 없어야 함
				const isUsernameValid = hasUsernameValue && hasBasicFormat && usernameField.error === '';
				const isEmailValid = hasEmailValue && emailField.error === '';

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
	async function validateCurrentStep(): Promise<boolean> {
		switch (currentStep) {
			case RegisterStep.BASIC_INFO:
				return firstNameField.value.trim() !== '' && lastNameField.value.trim() !== '';
			case RegisterStep.ACCOUNT_INFO: {
				// 먼저 기본 유효성 검사
				const usernameValid = usernameField.validate();
				const emailValid = emailField.validate();

				if (!usernameValid || !emailValid) {
					return false;
				}

				// 실시간 중복 체크가 이미 수행되어 오류가 있는지 확인
				if (usernameField.error || emailField.error) {
					return false;
				}

				// RegisterAccountInfoStep에서 실시간 검증 결과 확인
				if (registerAccountInfoStep) {
					const validationResults = registerAccountInfoStep.getValidationResults();

					// 실시간 검증이 완료되고 사용 가능한 경우에만 통과
					if (validationResults.username && !validationResults.username.available) {
						usernameField.setError(validationResults.username.message);
						return false;
					}

					if (validationResults.email && !validationResults.email.available) {
						emailField.setError(validationResults.email.message);
						return false;
					}
				}

				// 마지막으로 서버 측 중복 체크 재확인 (실시간 검증이 없는 경우)
				try {
					const [usernameCheck, emailCheck] = await Promise.all([
						apiClient.checkUsernameForRegistration(usernameField.value.trim()),
						apiClient.checkEmail(emailField.value.trim())
					]);

					if (!usernameCheck.available) {
						usernameField.setError(usernameCheck.message);
						return false;
					}

					if (!emailCheck.available) {
						emailField.setError(emailCheck.message);
						return false;
					}

					return true;
				} catch (error) {
					console.error('중복 체크 실패:', error);
					return false;
				}
			}
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
		const isValid = await validateCurrentStep();

		if (!isValid) {
			if (currentStep === RegisterStep.BASIC_INFO) {
				toast.warning('이름과 성을 모두 입력해주세요.');
			} else if (currentStep === RegisterStep.ACCOUNT_INFO) {
				// 더 구체적인 에러 메시지 제공
				if (usernameField.error) {
					toast.error(usernameField.error);
				} else if (emailField.error) {
					toast.error(emailField.error);
				} else {
					toast.warning('사용자 이름과 이메일을 올바르게 입력해주세요.');
				}
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
			event.preventDefault();
			if (currentStep === RegisterStep.TERMS_AGREEMENT) {
				handleRegister();
			} else {
				nextStep();
			}
		}
	}

	// 폼 제출 핸들러 (기본 동작 방지)
	function handleFormSubmit(event: SubmitEvent) {
		event.preventDefault();
		handleRegister();
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
			toast.success('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.');
			await goto('/auth/login?message=registration-complete');
		} catch (error: unknown) {
			const message = (error as Error)?.message || '회원가입 중 오류가 발생했습니다.';

			// 중복 오류인지 서버 API로 다시 확인
			try {
				const [usernameCheck, emailCheck] = await Promise.all([
					apiClient.checkUsernameForRegistration(usernameField.value.trim()),
					apiClient.checkEmail(emailField.value.trim())
				]);

				let hasConflict = false;

				if (!usernameCheck.available) {
					usernameField.setError(usernameCheck.message);
					currentStep = RegisterStep.ACCOUNT_INFO;
					toast.error('사용자명 중복 오류가 발생했습니다. 다른 사용자명을 사용해주세요.');
					hasConflict = true;
				}

				if (!emailCheck.available) {
					emailField.setError(emailCheck.message);
					currentStep = RegisterStep.ACCOUNT_INFO;
					toast.error('이메일 중복 오류가 발생했습니다. 다른 이메일을 사용해주세요.');
					hasConflict = true;
				}

				// 중복 오류가 아닌 경우에만 일반 에러 메시지 표시
				if (!hasConflict) {
					toast.error(message);
				}
			} catch (checkError) {
				// 중복 체크 실패 시 원래 에러 메시지 표시
				console.error('중복 체크 실패:', checkError);
				toast.error(message);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>회원가입 - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-stone-50 via-gray-50 to-neutral-100 px-4 py-12"
>
	<!-- 배경 패턴 -->
	<div
		class="bg-grid-slate-100 absolute inset-0 -z-10 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
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
				onsubmit={handleFormSubmit}
				class="min-h-[400px] space-y-4 transition-all duration-300"
				class:opacity-50={isStepTransitioning}
			>
				<!-- 단계별 컴포넌트 -->
				{#if currentStep === RegisterStep.BASIC_INFO}
					{#key RegisterStep.BASIC_INFO}
						<div class="animate-in slide-in-from-right-4 duration-300">
							<RegisterBasicInfoStep
								{firstNameField}
								{lastNameField}
								bind:userType
								{isLoading}
								onKeyPress={handleKeyPress}
							/>
						</div>
					{/key}
				{:else if currentStep === RegisterStep.ACCOUNT_INFO}
					{#key RegisterStep.ACCOUNT_INFO}
						<div class="animate-in slide-in-from-right-4 duration-300">
							<RegisterAccountInfoStep
								bind:this={registerAccountInfoStep}
								{usernameField}
								{emailField}
								{isLoading}
								onKeyPress={handleKeyPress}
							/>
						</div>
					{/key}
				{:else if currentStep === RegisterStep.PASSWORD_SETUP}
					{#key RegisterStep.PASSWORD_SETUP}
						<div class="animate-in slide-in-from-right-4 duration-300">
							<RegisterPasswordStep
								{passwordField}
								{confirmPasswordField}
								{passwordRequirements}
								{isLoading}
								onKeyPress={handleKeyPress}
							/>
						</div>
					{/key}
				{:else if currentStep === RegisterStep.TERMS_AGREEMENT}
					{#key RegisterStep.TERMS_AGREEMENT}
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
					{/key}
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
					class="font-medium text-stone-600 transition-colors duration-200 hover:text-stone-500"
				>
					로그인하기
				</a>
			</p>
		</div>
	</div>
</div>
