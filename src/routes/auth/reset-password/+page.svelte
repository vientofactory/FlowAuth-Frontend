<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Card, Button, LoadingButton } from '$lib';
	import { useToast, useFieldValidation, useFormValidation, validators } from '$lib';
	import { APP_CONSTANTS, ROUTES } from '$lib/constants/app.constants';

	let loading = $state(true);
	let submitting = $state(false);
	let validToken = $state(false);
	let email = $state('');
	let error = $state('');
	let success = $state(false);

	const toast = useToast();

	// Form validation using existing patterns
	const passwordField = useFieldValidation('', validators.password);
	const confirmPasswordField = useFieldValidation('', (value: string) => {
		return validators.confirmPassword(() => passwordField.value)(value);
	});

	const form = useFormValidation({
		password: passwordField,
		confirmPassword: confirmPasswordField
	});

	// UI states
	let passwordVisible = $state(false);
	let confirmPasswordVisible = $state(false);

	let token = '';

	onMount(async () => {
		if (!browser) return;

		token = $page.url.searchParams.get('token') || '';

		if (!token) {
			error = '비밀번호 재설정 토큰이 없습니다.';
			loading = false;
			return;
		}

		try {
			// 토큰 유효성 확인
			const response = await fetch(
				`${APP_CONSTANTS.API_BASE_URL}/auth/validate-reset-token/${token}`
			);
			const data = await response.json();

			if (data.valid) {
				validToken = true;
				email = data.email;
			} else {
				error = '유효하지 않거나 만료된 토큰입니다.';
			}
		} catch (err) {
			console.error('Token validation error:', err);
			error = '네트워크 오류가 발생했습니다.';
		} finally {
			loading = false;
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// Form validation using existing patterns
		if (!form.validateAll()) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		if (submitting) return; // 중복 제출 방지

		submitting = true;
		error = ''; // 이전 오류 메시지 클리어

		try {
			const response = await fetch(`${APP_CONSTANTS.API_BASE_URL}/auth/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token,
					newPassword: passwordField.value
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = true;
				toast.success('비밀번호가 성공적으로 변경되었습니다!');

				// 3초 후 로그인 페이지로 리다이렉트
				setTimeout(() => {
					goto(`${ROUTES.LOGIN}?message=password-reset-success`);
				}, 3000);
			} else {
				error = data.message || '비밀번호 재설정 중 오류가 발생했습니다.';
				toast.error(error);
			}
		} catch (err) {
			console.error('Password reset error:', err);
			error = '네트워크 오류가 발생했습니다.';
			toast.error(error);
		} finally {
			submitting = false;
		}
	}

	function togglePasswordVisibility() {
		passwordVisible = !passwordVisible;
	}

	function toggleConfirmPasswordVisibility() {
		confirmPasswordVisible = !confirmPasswordVisible;
	}

	// Password requirements check
	const passwordRequirements = $derived(() => ({
		minLength: passwordField.value.length >= 8,
		hasLowercase: /(?=.*[a-z])/.test(passwordField.value),
		hasUppercase: /(?=.*[A-Z])/.test(passwordField.value),
		hasNumber: /(?=.*\d)/.test(passwordField.value)
	}));
</script>

<svelte:head>
	<title>비밀번호 재설정 - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-stone-50 via-gray-50 to-neutral-100 px-4 py-12"
>
	<!-- 배경 패턴 -->
	<div
		class="bg-grid-slate-100 absolute inset-0 -z-10 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
	></div>

	<div class="w-full max-w-md">
		<!-- 로고 및 타이틀 -->
		<div class="mb-8 text-center">
			<div class="inline-flex items-center">
				<img src="/logo_1.png" alt="FlowAuth Logo" class="h-16 w-auto rounded-2xl object-contain" />
			</div>
			<p class="text-lg text-gray-600">오픈소스 통합 인증 시스템</p>
		</div>

		<Card class="animate-card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="text-center">
				<div class="mb-6">
					<h2 class="mb-2 text-2xl font-bold text-gray-900">비밀번호 재설정</h2>
					<p class="text-gray-600">
						{#if loading}
							토큰을 확인하고 있습니다...
						{:else if success}
							비밀번호가 성공적으로 변경되었습니다
						{:else if error}
							재설정 처리 중 문제가 발생했습니다
						{:else if validToken}
							새로운 비밀번호를 설정해주세요
						{/if}
					</p>
				</div>

				{#if loading}
					<div class="flex flex-col items-center space-y-4">
						<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
						<p class="text-sm text-gray-500">토큰을 확인하고 있습니다...</p>
					</div>
				{:else if success}
					<div class="space-y-6">
						<div
							class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
						>
							<svg
								class="h-8 w-8 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>

						<div class="space-y-2">
							<h3 class="text-lg font-medium text-gray-900">재설정 완료!</h3>
							<p class="text-sm text-gray-600">
								비밀번호가 성공적으로 변경되었습니다.<br />
								잠시 후 로그인 페이지로 이동합니다.
							</p>
						</div>

						<div class="space-y-3">
							<Button
								variant="primary"
								class="w-full"
								onclick={() => goto(`${ROUTES.LOGIN}?message=password-reset-success`)}
							>
								<i class="fas fa-sign-in-alt mr-2"></i>
								로그인하기
							</Button>
						</div>
					</div>
				{:else if error}
					<div class="space-y-6">
						<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
							<svg
								class="h-8 w-8 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>

						<div class="space-y-2">
							<h3 class="text-lg font-medium text-gray-900">오류 발생</h3>
							<p class="text-sm text-red-600">{error}</p>
						</div>

						<div class="space-y-3">
							<Button
								variant="primary"
								class="w-full"
								onclick={() => goto(ROUTES.LOGIN)}
								disabled={submitting}
							>
								<i class="fas fa-arrow-left mr-2"></i>
								로그인 페이지로 이동
							</Button>

							<Button
								variant="outline"
								class="w-full"
								onclick={() => goto(ROUTES.FORGOT_PASSWORD)}
								disabled={submitting}
							>
								비밀번호 재설정 다시 요청하기
							</Button>
						</div>
					</div>
				{:else if validToken}
					<div class="text-left">
						{#if email}
							<div class="mb-6 text-center">
								<p class="text-sm text-gray-600">
									<span class="font-medium">{email}</span> 계정의 비밀번호를 재설정합니다.
								</p>
							</div>
						{/if}

						<form onsubmit={handleSubmit} class="space-y-6">
							<!-- 새 비밀번호 입력 -->
							<div class="relative">
								<label for="password" class="mb-2 block text-sm font-medium text-gray-700">
									<i class="fas fa-lock mr-2 text-blue-500"></i>새 비밀번호<span
										class="text-red-500">*</span
									>
								</label>
								<input
									id="password"
									type={passwordVisible ? 'text' : 'password'}
									bind:value={passwordField.value}
									oninput={() => passwordField.validate()}
									required
									disabled={submitting}
									class="relative block w-full appearance-none border px-3 py-2 pr-10 {passwordField.error
										? 'border-red-300'
										: 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm {submitting
										? 'cursor-not-allowed bg-gray-50'
										: ''}"
									placeholder="새 비밀번호를 입력하세요"
								/>
								<button
									type="button"
									onclick={togglePasswordVisibility}
									disabled={submitting}
									class="absolute inset-y-0 top-8 right-0 flex items-center pr-3 {submitting
										? 'cursor-not-allowed'
										: ''}"
									aria-label={passwordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
								>
									<i
										class="fas {passwordVisible ? 'fa-eye-slash' : 'fa-eye'} h-5 w-5 {submitting
											? 'text-gray-300'
											: 'text-gray-400'}"
									></i>
								</button>
								{#if passwordField.error}
									<p class="mt-1 text-sm text-red-600">
										<i class="fas fa-exclamation-circle mr-1"></i>
										{passwordField.error}
									</p>
								{/if}
							</div>

							<!-- 비밀번호 확인 -->
							<div class="relative">
								<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
									<i class="fas fa-lock mr-2 text-blue-500"></i>비밀번호 확인<span
										class="text-red-500">*</span
									>
								</label>
								<input
									id="confirmPassword"
									type={confirmPasswordVisible ? 'text' : 'password'}
									bind:value={confirmPasswordField.value}
									oninput={() => confirmPasswordField.validate()}
									required
									disabled={submitting}
									class="relative block w-full appearance-none border px-3 py-2 pr-10 {confirmPasswordField.error
										? 'border-red-300'
										: 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm {submitting
										? 'cursor-not-allowed bg-gray-50'
										: ''}"
									placeholder="비밀번호를 다시 입력하세요"
								/>
								<button
									type="button"
									onclick={toggleConfirmPasswordVisibility}
									disabled={submitting}
									class="absolute inset-y-0 top-8 right-0 flex items-center pr-3 {submitting
										? 'cursor-not-allowed'
										: ''}"
									aria-label={confirmPasswordVisible
										? '비밀번호 확인 숨기기'
										: '비밀번호 확인 보기'}
								>
									<i
										class="fas {confirmPasswordVisible
											? 'fa-eye-slash'
											: 'fa-eye'} h-5 w-5 {submitting ? 'text-gray-300' : 'text-gray-400'}"
									></i>
								</button>
								{#if confirmPasswordField.error}
									<p class="mt-1 text-sm text-red-600">
										<i class="fas fa-exclamation-circle mr-1"></i>
										{confirmPasswordField.error}
									</p>
								{/if}
							</div>

							<!-- 비밀번호 강도 가이드 -->
							<div class="rounded-lg bg-gray-50 p-4">
								<p class="mb-2 text-xs font-medium text-gray-600">비밀번호 요구사항:</p>
								<div class="grid grid-cols-2 gap-2">
									<div class="flex items-center text-xs">
										<span
											class="h-2 w-2 rounded-full {passwordRequirements().minLength
												? 'bg-green-500'
												: 'bg-gray-300'} mr-2"
										></span>
										최소 8자 이상
									</div>
									<div class="flex items-center text-xs">
										<span
											class="h-2 w-2 rounded-full {passwordRequirements().hasLowercase
												? 'bg-green-500'
												: 'bg-gray-300'} mr-2"
										></span>
										소문자 포함
									</div>
									<div class="flex items-center text-xs">
										<span
											class="h-2 w-2 rounded-full {passwordRequirements().hasUppercase
												? 'bg-green-500'
												: 'bg-gray-300'} mr-2"
										></span>
										대문자 포함
									</div>
									<div class="flex items-center text-xs">
										<span
											class="h-2 w-2 rounded-full {passwordRequirements().hasNumber
												? 'bg-green-500'
												: 'bg-gray-300'} mr-2"
										></span>
										숫자 포함
									</div>
								</div>
							</div>

							<!-- 제출 버튼 -->
							<div class="space-y-4">
								<LoadingButton
									type="submit"
									loading={submitting}
									loadingText="재설정 중..."
									class="w-full"
									disabled={!form.isValid || submitting}
								>
									<i class="fas fa-key mr-2"></i>
									비밀번호 재설정
								</LoadingButton>

								<Button
									variant="outline"
									class="w-full"
									onclick={() => goto(ROUTES.LOGIN)}
									disabled={submitting}
								>
									<i class="fas fa-arrow-left mr-2"></i>
									로그인 페이지로 돌아가기
								</Button>
							</div>
						</form>
					</div>
				{/if}

				{#if !loading && !success}
					<div class="mt-8 text-center">
						<a
							href={ROUTES.HOME}
							class="inline-flex items-center text-sm {submitting
								? 'pointer-events-none cursor-not-allowed text-gray-300'
								: 'text-gray-500 transition-colors duration-200 hover:text-gray-700'}"
						>
							<i class="fas fa-home mr-1"></i>
							홈으로 돌아가기
						</a>
					</div>
				{/if}
			</div>
		</Card>
	</div>
</div>
