<script lang="ts">
	import { Card, FormField, LoadingButton, useToast, apiClient } from '$lib';
	import { useFieldValidation, useFormValidation, validators } from '$lib';
	import type { CreateUserDto } from '$lib';
	import { goto } from '$app/navigation';
	import { USER_TYPES } from '$lib/types/user.types';
	import { env } from '$lib/config/env';
	import { onMount } from 'svelte';
	import { load, type ReCaptchaInstance } from 'recaptcha-v3';

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

	// 비밀번호 요구사항별 상태
	interface PasswordRequirement {
		id: string;
		label: string;
		check: (password: string) => boolean;
		met: boolean;
	}

	let passwordRequirements = $state<PasswordRequirement[]>([
		{
			id: 'length',
			label: '최소 8자 이상',
			check: (password: string) => password.length >= 8,
			met: false
		},
		{
			id: 'lowercase',
			label: '소문자 포함',
			check: (password: string) => /(?=.*[a-z])/.test(password),
			met: false
		},
		{
			id: 'uppercase',
			label: '대문자 포함',
			check: (password: string) => /(?=.*[A-Z])/.test(password),
			met: false
		},
		{
			id: 'number',
			label: '숫자 포함',
			check: (password: string) => /(?=.*\d)/.test(password),
			met: false
		},
		{
			id: 'special',
			label: '특수문자 포함 (@$!%*?&)',
			check: (password: string) => /(?=.*[@$!%*?&])/.test(password),
			met: false
		}
	]);

	// 실시간 요구사항 검증
	$effect(() => {
		passwordRequirements.forEach((requirement) => {
			requirement.met = requirement.check(passwordField.value);
		});
	});

	// 전체 비밀번호 검증 상태
	let isPasswordValid = $derived(passwordRequirements.every((req) => req.met));
	let isConfirmPasswordValid = $derived(
		confirmPasswordField.value && passwordField.value === confirmPasswordField.value
	);

	// 비밀번호 강도 체크
	function getPasswordStrength(_password: string) {
		const metRequirements = passwordRequirements.filter((req) => req.met).length;
		const totalRequirements = passwordRequirements.length;
		const percentage = (metRequirements / totalRequirements) * 100;

		if (percentage < 40)
			return { text: '매우 약함', color: 'text-red-600', bg: 'bg-red-400', width: '20%' };
		if (percentage < 60)
			return { text: '약함', color: 'text-red-500', bg: 'bg-red-300', width: '40%' };
		if (percentage < 80)
			return { text: '보통', color: 'text-yellow-500', bg: 'bg-yellow-400', width: '60%' };
		if (percentage < 100)
			return { text: '강함', color: 'text-blue-500', bg: 'bg-blue-400', width: '80%' };
		return { text: '매우 강함', color: 'text-green-500', bg: 'bg-green-400', width: '100%' };
	}

	let passwordStrength = $derived(
		passwordField.value ? getPasswordStrength(passwordField.value) : null
	);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	let userType = $state(USER_TYPES.REGULAR); // 기본값: 일반 사용자
	let isLoading = $state(false);
	let agreeToTerms = $state(false);
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

	// 단계별 검증 상태 (상태 변경 없이 순수한 검사만)
	function isCurrentStepValid(): boolean {
		switch (currentStep) {
			case RegisterStep.BASIC_INFO:
				// 이름과 성이 모두 입력되어야 함
				return (
					firstNameField.value.trim() !== '' &&
					firstNameField.value.trim().length >= 2 &&
					lastNameField.value.trim() !== '' &&
					lastNameField.value.trim().length >= 2
				);
			case RegisterStep.ACCOUNT_INFO: {
				// 사용자 이름과 이메일이 모두 유효해야 함
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
				// 모든 비밀번호 요구사항이 충족되고 비밀번호 확인이 일치해야 함
				return (
					isPasswordValid &&
					Boolean(isConfirmPasswordValid) &&
					passwordField.value === confirmPasswordField.value
				);
			case RegisterStep.TERMS_AGREEMENT:
				// 이용약관에 동의해야 함
				return agreeToTerms;
			default:
				return false;
		}
	}

	// 현재 단계의 유효성 상태
	let currentStepValid = $derived(isCurrentStepValid());

	// 단계별 검증 함수 (실제 검증 수행)
	function validateCurrentStep(): boolean {
		switch (currentStep) {
			case RegisterStep.BASIC_INFO:
				return firstNameField.value.trim() !== '' && lastNameField.value.trim() !== '';
			case RegisterStep.ACCOUNT_INFO:
				return usernameField.validate() && emailField.validate();
			case RegisterStep.PASSWORD_SETUP:
				return isPasswordValid && Boolean(isConfirmPasswordValid);
			case RegisterStep.TERMS_AGREEMENT:
				return agreeToTerms;
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
				toast.warning('이용약관에 동의해주세요.');
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

	// 단계별 제목과 설명
	function getStepInfo(step: RegisterStepType) {
		switch (step) {
			case RegisterStep.BASIC_INFO:
				return { title: '기본 정보', description: '이름과 성을 입력해주세요' };
			case RegisterStep.ACCOUNT_INFO:
				return { title: '계정 정보', description: '사용자 이름과 이메일을 설정해주세요' };
			case RegisterStep.PASSWORD_SETUP:
				return { title: '비밀번호 설정', description: '안전한 비밀번호를 설정해주세요' };
			case RegisterStep.TERMS_AGREEMENT:
				return { title: '약관 동의', description: '서비스 이용을 위해 동의해주세요' };
			default:
				return { title: '회원가입', description: '새 계정을 만들어주세요' };
		}
	}

	let stepInfo = $derived(getStepInfo(currentStep));

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

		// 이용약관 동의 확인
		if (!agreeToTerms) {
			toast.warning('이용약관에 동의해주세요.');
			return;
		}

		// reCAPTCHA 검증 (필수)
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
			if (currentStep === RegisterStep.TERMS_AGREEMENT) {
				handleRegister();
			} else {
				nextStep();
			}
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
			<div class="mb-6">
				<div class="mb-4 flex items-center justify-between">
					{#each Array(4) as _, index (index)}
						{@const stepNumber = index + 1}
						{@const isActive = stepNumber === currentStep}
						{@const isCompleted = stepNumber < currentStep}
						<div class="flex items-center">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 {isCompleted
									? 'border-green-500 bg-green-500 text-white'
									: isActive
										? 'border-blue-500 bg-blue-500 text-white'
										: 'border-gray-300 bg-white text-gray-400'}"
							>
								{#if isCompleted}
									<i class="fas fa-check text-xs"></i>
								{:else}
									{stepNumber}
								{/if}
							</div>
							{#if index < 3}
								<div
									class="mx-2 h-1 w-12 rounded-full transition-all duration-300 {stepNumber <
									currentStep
										? 'bg-green-500'
										: 'bg-gray-200'}"
								></div>
							{/if}
						</div>
					{/each}
				</div>
				<div class="text-center">
					<h2 class="text-xl font-bold text-gray-900 sm:text-2xl">{stepInfo.title}</h2>
					<p class="text-sm text-gray-600 sm:text-base">{stepInfo.description}</p>

					<!-- 단계별 요구사항 안내 -->
					{#if !currentStepValid}
						<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
							<div class="flex items-center">
								<i class="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
								<div class="text-left">
									{#if currentStep === RegisterStep.BASIC_INFO}
										<p class="text-sm text-amber-700">
											<strong>완료 조건:</strong> 이름과 성을 각각 2글자 이상 입력해주세요
										</p>
									{:else if currentStep === RegisterStep.ACCOUNT_INFO}
										<p class="text-sm text-amber-700">
											<strong>완료 조건:</strong> 사용자 이름(3글자 이상, 영문/숫자/언더스코어만)과 유효한
											이메일을 입력해주세요
										</p>
									{:else if currentStep === RegisterStep.PASSWORD_SETUP}
										<p class="text-sm text-amber-700">
											<strong>완료 조건:</strong> 모든 비밀번호 요구사항을 만족하고 비밀번호 확인이 일치해야
											합니다
										</p>
									{:else if currentStep === RegisterStep.TERMS_AGREEMENT}
										<p class="text-sm text-amber-700">
											<strong>완료 조건:</strong> 이용약관 및 개인정보처리방침에 동의해주세요
										</p>
									{/if}
								</div>
							</div>
						</div>
					{:else}
						<div class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
							<div class="flex items-center justify-center">
								<i class="fas fa-check-circle mr-2 text-green-500"></i>
								<p class="text-sm text-green-700">
									<strong>모든 요구사항이 충족되었습니다!</strong> 다음 단계로 진행할 수 있습니다.
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<form
				onsubmit={handleRegister}
				class="min-h-[400px] space-y-4 transition-all duration-300"
				class:opacity-50={isStepTransitioning}
			>
				<!-- 단계 1: 기본 정보 -->
				{#if currentStep === RegisterStep.BASIC_INFO}
					<div class="animate-in slide-in-from-right-4 space-y-4 duration-300">
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
								onkeydown={handleKeyPress}
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
								onkeydown={handleKeyPress}
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
									<p class="text-xs text-gray-500">
										주의: 사용자 유형은 가입 후 변경할 수 없습니다.
									</p>
								</div>
							</fieldset>
						</div>
					</div>

					<!-- 단계 2: 계정 정보 -->
				{:else if currentStep === RegisterStep.ACCOUNT_INFO}
					<div class="animate-in slide-in-from-right-4 space-y-4 duration-300">
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
							onkeydown={handleKeyPress}
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
							onkeydown={handleKeyPress}
						/>
					</div>

					<!-- 단계 3: 비밀번호 설정 -->
				{:else if currentStep === RegisterStep.PASSWORD_SETUP}
					<div class="animate-in slide-in-from-right-4 space-y-4 duration-300">
						<!-- 비밀번호 입력 -->
						<div class="space-y-2">
							<label for="password" class="block text-sm font-medium text-gray-700">
								<i class="fas fa-lock mr-2 text-blue-500"></i>
								비밀번호
							</label>
							<div class="relative">
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									bind:value={passwordField.value}
									oninput={() => passwordField.validate()}
									onkeydown={handleKeyPress}
									placeholder="비밀번호를 입력하세요"
									class="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
									disabled={isLoading}
									required
								/>
								<button
									type="button"
									onclick={() => (showPassword = !showPassword)}
									class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
									aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보이기'}
								>
									<i class="fas {showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
								</button>
							</div>

							<!-- 비밀번호 강도 표시 -->
							{#if passwordField.value && passwordStrength}
								<div class="mt-2">
									<div class="flex items-center justify-between text-sm">
										<span class="font-medium text-gray-700">비밀번호 강도</span>
										<span class={passwordStrength.color}>{passwordStrength.text}</span>
									</div>
									<div class="mt-1 h-2 w-full rounded-full bg-gray-200">
										<div
											class="h-2 rounded-full transition-all duration-300 {passwordStrength.bg}"
											style="width: {passwordStrength.width}"
										></div>
									</div>
								</div>
							{/if}

							<!-- 비밀번호 요구사항 -->
							<div class="mt-3 space-y-1">
								<p class="text-sm font-medium text-gray-700">비밀번호 요구사항:</p>
								<div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
									{#each passwordRequirements as requirement (requirement.id)}
										<div class="flex items-center space-x-2">
											<i
												class="fas {requirement.met
													? 'fa-check text-green-500'
													: 'fa-times text-red-500'} text-xs"
											></i>
											<span class="text-xs {requirement.met ? 'text-green-700' : 'text-gray-600'}">
												{requirement.label}
											</span>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- 비밀번호 확인 -->
						<div class="space-y-2">
							<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
								<i class="fas fa-lock mr-2 text-blue-500"></i>
								비밀번호 확인
							</label>
							<div class="relative">
								<input
									id="confirmPassword"
									type={showConfirmPassword ? 'text' : 'password'}
									bind:value={confirmPasswordField.value}
									oninput={() => confirmPasswordField.validate()}
									onkeydown={handleKeyPress}
									placeholder="비밀번호를 다시 입력하세요"
									class="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none {confirmPasswordField.value &&
									!isConfirmPasswordValid
										? 'border-red-300 focus:border-red-500 focus:ring-red-500'
										: ''}"
									disabled={isLoading}
									required
								/>
								<button
									type="button"
									onclick={() => (showConfirmPassword = !showConfirmPassword)}
									class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
									aria-label={showConfirmPassword ? '비밀번호 확인 숨기기' : '비밀번호 확인 보이기'}
								>
									<i class="fas {showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
								</button>
							</div>

							<!-- 비밀번호 일치 여부 표시 -->
							{#if confirmPasswordField.value}
								<div class="flex items-center space-x-2">
									<i
										class="fas {isConfirmPasswordValid
											? 'fa-check text-green-500'
											: 'fa-times text-red-500'} text-xs"
									></i>
									<span
										class="text-xs {isConfirmPasswordValid ? 'text-green-700' : 'text-red-600'}"
									>
										{isConfirmPasswordValid
											? '비밀번호가 일치합니다'
											: '비밀번호가 일치하지 않습니다'}
									</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- 단계 4: 약관 동의 -->
				{:else if currentStep === RegisterStep.TERMS_AGREEMENT}
					<div class="animate-in slide-in-from-right-4 space-y-6 duration-300">
						<div class="rounded-lg bg-blue-50 p-4">
							<div class="flex">
								<div class="flex-shrink-0">
									<i class="fas fa-info-circle text-blue-400"></i>
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-blue-800">회원가입 정보 확인</h3>
									<div class="mt-2 text-sm text-blue-700">
										<p><strong>이름:</strong> {firstNameField.value} {lastNameField.value}</p>
										<p><strong>사용자 이름:</strong> {usernameField.value}</p>
										<p><strong>이메일:</strong> {emailField.value}</p>
										<p>
											<strong>계정 유형:</strong>
											{userType === USER_TYPES.DEVELOPER ? '개발자' : '일반 사용자'}
										</p>
									</div>
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
					</div>
				{/if}

				<!-- 네비게이션 버튼 -->
				<div class="flex items-center justify-between pt-6">
					{#if currentStep > RegisterStep.BASIC_INFO}
						<button
							type="button"
							onclick={prevStep}
							class="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							disabled={isLoading || isStepTransitioning}
						>
							<i class="fas fa-arrow-left mr-2"></i>
							이전
						</button>
					{:else}
						<div></div>
					{/if}

					{#if currentStep === RegisterStep.TERMS_AGREEMENT}
						<LoadingButton
							variant="primary"
							type="submit"
							loading={isLoading}
							loadingText="회원가입 중..."
							disabled={!agreeToTerms}
							icon="fas fa-user-plus"
							class="transform px-6 py-2.5 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
						>
							회원가입 완료
						</LoadingButton>
					{:else}
						<button
							type="button"
							onclick={nextStep}
							class="flex items-center rounded-lg px-6 py-2.5 text-sm font-medium shadow-lg transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none {currentStepValid
								? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl focus:ring-blue-500'
								: 'cursor-not-allowed bg-gray-300 text-gray-500'}"
							disabled={isLoading || isStepTransitioning || !currentStepValid}
							title={!currentStepValid ? '모든 필수 정보를 입력해주세요' : ''}
						>
							다음
							<i class="fas fa-arrow-right ml-2"></i>
						</button>
					{/if}
				</div>
			</form>

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
