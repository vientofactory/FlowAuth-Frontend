<script lang="ts">
	import { Card, Button, FormField, LoadingButton } from '$lib';
	import { useToast, useFieldValidation, useFormValidation, validators } from '$lib';
	import { inputHandlers } from '$lib/utils/input.utils';
	import { authStore } from '$lib/stores/auth';
	import { MESSAGES, ROUTES } from '$lib/constants/app.constants';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { env } from '$lib/config/env';
	import { load } from 'recaptcha-v3';

	// 폼 검증 필드들
	const emailField = useFieldValidation('', validators.email);
	const passwordField = useFieldValidation('', validators.required('비밀번호'));
	const twoFactorTokenField = useFieldValidation('', validators.twoFactorToken);
	const backupCodeField = useFieldValidation('', validators.backupCode);

	const form = useFormValidation({
		email: emailField,
		password: passwordField
	});

	let isLoading = $state(false);
	let returnUrl = $state('');
	let recaptchaToken = $state('');
	let recaptchaInstance: any = null;

	// 2FA 관련 상태
	let requiresTwoFactor = $state(false);
	let isTwoFactorLoading = $state(false);
	let twoFactorMode = $state<'token' | 'backup'>('token'); // 토큰 또는 백업 코드 모드

	// 중앙화된 토스트 훅 사용
	const toast = useToast();

	// URL 파라미터에서 returnUrl 확인
	onMount(() => {
		const unsubscribe = page.subscribe(($page) => {
			returnUrl = $page.url.searchParams.get('returnUrl') || '';
		});

		// reCAPTCHA 초기화
		if (env.RECAPTCHA_SITE_KEY) {
			load(env.RECAPTCHA_SITE_KEY).then((instance) => {
				recaptchaInstance = instance;
			}).catch((error) => {
				console.error('reCAPTCHA 초기화 실패:', error);
			});
		}

		return unsubscribe;
	});

	// 토큰 입력 핸들러 - 숫자만 허용
	const handleTokenInput = inputHandlers.twoFactorToken(twoFactorTokenField);

	// 백업 코드 입력 핸들러
	const handleBackupCodeInput = inputHandlers.backupCode(backupCodeField);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		// 폼 검증
		if (!form.validateAll()) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		if (isLoading) return;

		// reCAPTCHA 검증
		if (env.RECAPTCHA_SITE_KEY && recaptchaInstance) {
			try {
				recaptchaToken = await recaptchaInstance.execute('login');
			} catch (error) {
				toast.error('reCAPTCHA 검증에 실패했습니다. 다시 시도해주세요.');
				return;
			}
		}

		isLoading = true;

		try {
			await authStore.login(emailField.value, passwordField.value, recaptchaToken);

			// 리다이렉트 처리 - returnUrl이 있으면 해당 URL로, 없으면 대시보드로
			if (returnUrl) {
				// OAuth2 플로우나 다른 특정 URL로 복귀
				window.location.href = returnUrl;
			} else {
				// 일반 로그인의 경우 대시보드로
				goto(ROUTES.DASHBOARD);
			}
		} catch (err) {
			console.log('Login error:', err);
			console.log('Error message:', err instanceof Error ? err.message : 'Unknown error');
			console.log('Error details:', err);

			// 2FA가 필요한 경우 처리
			if (err instanceof Error && err.message.includes('2FA')) {
				console.log('2FA required detected, showing 2FA UI');
				requiresTwoFactor = true;
				toast.info('2단계 인증이 필요합니다. 인증 앱에서 토큰을 확인해주세요.');
			} else {
				const errorMessage = err instanceof Error ? err.message : MESSAGES.VALIDATION.LOGIN_FAILED;
				console.log('Showing error message:', errorMessage);
				toast.error(errorMessage);
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleTwoFactorSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (twoFactorMode === 'token') {
			// 토큰 검증
			if (!twoFactorTokenField.validate()) {
				toast.warning('2FA 토큰을 확인해주세요.');
				return;
			}
		} else {
			// 백업 코드 검증
			if (!backupCodeField.validate()) {
				toast.warning('백업 코드를 확인해주세요.');
				return;
			}
		}

		if (isTwoFactorLoading) return;

		isTwoFactorLoading = true;

		try {
			if (twoFactorMode === 'token') {
				await authStore.verifyTwoFactorLogin(emailField.value, twoFactorTokenField.value);
			} else {
				await authStore.verifyBackupCodeLogin(emailField.value, backupCodeField.value);
			}

			// 성공 시 리다이렉트
			if (returnUrl) {
				window.location.href = returnUrl;
			} else {
				goto(ROUTES.DASHBOARD);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: twoFactorMode === 'token'
						? '2FA 토큰이 잘못되었습니다.'
						: '백업 코드가 잘못되었거나 이미 사용되었습니다.';
			toast.error(errorMessage);
		} finally {
			isTwoFactorLoading = false;
		}
	}

	function handleBackToLogin() {
		requiresTwoFactor = false;
		twoFactorTokenField.value = '';
		backupCodeField.value = '';
		twoFactorTokenField.clear();
		backupCodeField.clear();
		twoFactorMode = 'token';
	}

	function switchTwoFactorMode(mode: 'token' | 'backup') {
		twoFactorMode = mode;
		// 모드 변경 시 에러 초기화
		twoFactorTokenField.clear();
		backupCodeField.clear();
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
			<div class="inline-flex items-center">
				<img src="/logo_1.png" alt="FlowAuth Logo" class="h-16 w-auto rounded-2xl object-contain" />
			</div>
			<p class="text-lg text-gray-600">오픈소스 통합 인증 시스템</p>
		</div>

		<Card class="animate-card-enter border-0 bg-white/80 shadow-2xl backdrop-blur-sm">
			<div class="mb-8 text-center">
				<h2 class="mb-2 text-2xl font-bold text-gray-900">
					{#if requiresTwoFactor}
						2단계 인증
					{:else}
						로그인
					{/if}
				</h2>
				<p class="text-gray-600">
					{#if requiresTwoFactor}
						{#if twoFactorMode === 'token'}
							인증 앱에서 생성된 6자리 토큰을 입력하세요
						{:else}
							백업 코드를 입력하세요
						{/if}
					{:else}
						계정에 로그인하여 서비스를 이용하세요
					{/if}
				</p>
			</div>

			{#if requiresTwoFactor}
				<!-- 2FA 모드 선택 탭 -->
				<div class="mb-6">
					<div class="flex rounded-lg bg-gray-100 p-1">
						<button
							type="button"
							onclick={() => switchTwoFactorMode('token')}
							class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 {twoFactorMode ===
							'token'
								? 'bg-white text-blue-600 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							<i class="fas fa-mobile-alt mr-2"></i>
							토큰
						</button>
						<button
							type="button"
							onclick={() => switchTwoFactorMode('backup')}
							class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 {twoFactorMode ===
							'backup'
								? 'bg-white text-blue-600 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							<i class="fas fa-key mr-2"></i>
							백업 코드
						</button>
					</div>
				</div>

				<!-- 2FA 입력 폼 -->
				<form onsubmit={handleTwoFactorSubmit} class="space-y-6">
					{#if twoFactorMode === 'token'}
						<!-- 2FA 토큰 입력 -->
						<FormField
							label="2FA 토큰"
							name="twoFactorToken"
							type="text"
							placeholder="000000"
							bind:value={twoFactorTokenField.value}
							error={twoFactorTokenField.error}
							maxlength={6}
							inputmode="numeric"
							icon="fas fa-mobile-alt"
							class="text-center font-mono text-lg tracking-wider"
							autocomplete="off"
							oninput={handleTokenInput}
							disabled={isTwoFactorLoading}
							required
						/>
					{:else}
						<!-- 백업 코드 입력 -->
						<FormField
							label="백업 코드"
							name="backupCode"
							type="text"
							placeholder="ABCD-1234-EFGH"
							bind:value={backupCodeField.value}
							error={backupCodeField.error}
							icon="fas fa-key"
							class="text-center font-mono text-lg tracking-wider"
							hint="백업 코드는 한 번만 사용할 수 있습니다."
							autocomplete="off"
							oninput={handleBackupCodeInput}
							disabled={isTwoFactorLoading}
							required
						/>
					{/if}

					<div class="space-y-4">
						<LoadingButton
							type="submit"
							loading={isTwoFactorLoading}
							loadingText="확인 중..."
							class="w-full"
						>
							확인
						</LoadingButton>

						<Button
							type="button"
							variant="outline"
							onclick={handleBackToLogin}
							disabled={isTwoFactorLoading}
							class="w-full"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							로그인으로 돌아가기
						</Button>
					</div>
				</form>
			{:else}
				<!-- 일반 로그인 폼 -->
				<form onsubmit={handleSubmit} class="space-y-6">
					<!-- 이메일 입력 -->
					<FormField
						label="이메일 주소"
						name="email"
						type="email"
						placeholder="your@email.com"
						bind:value={emailField.value}
						error={emailField.error}
						icon="fas fa-envelope"
						oninput={() => emailField.validate()}
						disabled={isLoading}
						required
					/>

					<!-- 비밀번호 입력 -->
					<FormField
						label="비밀번호"
						name="password"
						type="password"
						placeholder="비밀번호를 입력하세요"
						bind:value={passwordField.value}
						error={passwordField.error}
						icon="fas fa-lock"
						oninput={() => passwordField.validate()}
						disabled={isLoading}
						required
					/>

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
					<LoadingButton
						variant="primary"
						type="submit"
						loading={isLoading}
						loadingText="로그인 중..."
						icon="fas fa-sign-in-alt"
						class="w-full transform py-3 text-lg font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
					>
						로그인
					</LoadingButton>
				</form>
			{/if}

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

	/* 배경 패턴 */
	.bg-grid-slate-100 {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5h32m-32 32h32m-32-32v32m32-32v32'/%3e%3c/svg%3e");
	}
</style>
