<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Card, Button, LoadingButton } from '$lib';
	import { useToast } from '$lib';
	import { ROUTES } from '$lib/constants/app.constants';
	import { apiClient } from '$lib/utils/api';
	import { getCookie } from '$lib/utils/cookie';

	let loading = $state(true);
	let verifying = $state(false);
	let verified = $state(false);
	let error = $state('');
	let email = $state('');
	let canResend = $state(false);
	let resendingEmail = $state(false);

	const toast = useToast();

	let token = '';

	onMount(async () => {
		if (!browser) return;

		token = $page.url.searchParams.get('token') || '';

		if (!token) {
			error = '유효하지 않은 인증 링크입니다.';
			loading = false;
			return;
		}

		await verifyEmail();
	});

	async function verifyEmail() {
		verifying = true;
		error = '';

		try {
			const data = await apiClient.auth.verifyEmail(token);

			verified = true;
			email = data.email || '';
			toast.success('이메일 인증이 성공적으로 완료되었습니다!');

			// 인증된 사용자가 이미 로그인되어 있다면 대시보드로, 그렇지 않으면 로그인 페이지로
			// 3초 후 리다이렉트
			setTimeout(() => {
				// 현재 로그인 상태를 확인하여 적절한 페이지로 리다이렉트
				const isLoggedIn = !!getCookie('token');
				if (isLoggedIn) {
					goto('/dashboard?message=email-verified');
				} else {
					goto(`${ROUTES.LOGIN}?message=email-verified`);
				}
			}, 3000);
		} catch (err) {
			console.error('Email verification error:', err);
			const errorMessage = err instanceof Error ? err.message : '이메일 인증에 실패했습니다.';
			error = errorMessage;

			// API 에러 응답에서 추가 정보 추출 (에러가 API 에러일 때만)
			if (err && typeof err === 'object' && 'status' in err) {
				const apiError = err as Error & { status?: number; email?: string; canResend?: boolean };
				email = apiError.email || '';
				canResend = apiError.canResend || false;
			}

			toast.error(error);
		} finally {
			loading = false;
			verifying = false;
		}
	}

	async function handleResendEmail() {
		if (!email || resendingEmail) return;

		resendingEmail = true;

		try {
			await apiClient.auth.resendVerificationEmail(email);

			toast.success('인증 이메일이 재전송되었습니다!');
			canResend = false; // 임시로 재전송 비활성화

			// 60초 후 다시 활성화
			setTimeout(() => {
				canResend = true;
			}, 60000);
		} catch (err) {
			console.error('Email resend error:', err);
			const errorMessage = err instanceof Error ? err.message : '이메일 재전송에 실패했습니다.';
			toast.error(errorMessage);
		} finally {
			resendingEmail = false;
		}
	}
</script>

<svelte:head>
	<title>이메일 인증 - FlowAuth</title>
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
					<h2 class="mb-2 text-2xl font-bold text-gray-900">이메일 인증</h2>
					<p class="text-gray-600">
						{#if loading || verifying}
							이메일 인증을 처리하고 있습니다...
						{:else if verified}
							이메일 인증이 성공적으로 완료되었습니다
						{:else if error}
							인증 처리 중 문제가 발생했습니다
						{:else}
							이메일 인증을 확인하세요
						{/if}
					</p>
				</div>

				{#if loading || verifying}
					<div class="flex flex-col items-center space-y-4">
						<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
						<p class="text-sm text-gray-500">
							{loading ? '토큰을 확인하고 있습니다...' : '이메일을 인증하고 있습니다...'}
						</p>
					</div>
				{:else if verified}
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
							<h3 class="text-lg font-medium text-gray-900">인증 완료!</h3>
							<p class="text-sm text-gray-600">
								이메일 인증이 성공적으로 완료되었습니다.<br />
								잠시 후 로그인 페이지로 이동합니다.
							</p>
							{#if email}
								<p class="text-xs text-gray-500">인증된 계정: {email}</p>
							{/if}
						</div>

						<div class="space-y-3">
							<Button
								variant="primary"
								class="w-full"
								onclick={() => goto(`${ROUTES.LOGIN}?message=email-verified`)}
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
							<h3 class="text-lg font-medium text-gray-900">인증 실패</h3>
							<p class="text-sm text-red-600">{error}</p>
							{#if email}
								<p class="text-xs text-gray-500">계정: {email}</p>
							{/if}
						</div>

						<div class="space-y-3">
							{#if canResend && email}
								<LoadingButton
									variant="primary"
									class="w-full"
									loading={resendingEmail}
									loadingText="전송 중..."
									onclick={handleResendEmail}
								>
									<i class="fas fa-envelope mr-2"></i>
									인증 이메일 재전송
								</LoadingButton>
							{/if}

							<Button variant="outline" class="w-full" onclick={() => goto(ROUTES.LOGIN)}>
								<i class="fas fa-arrow-left mr-2"></i>
								로그인 페이지로 이동
							</Button>
						</div>

						{#if canResend}
							<div class="rounded-lg bg-blue-50 p-4">
								<p class="text-xs text-blue-700">
									<i class="fas fa-info-circle mr-1"></i>
									<strong>도움말:</strong><br />
									• 인증 링크는 24시간 후 만료됩니다<br />
									• 스팸함을 확인해보세요<br />
									• 문제가 계속되면 고객지원에 문의하세요
								</p>
							</div>
						{/if}
					</div>
				{/if}

				{#if !loading && !verifying}
					<div class="mt-8 text-center">
						<a
							href={ROUTES.HOME}
							class="inline-flex items-center text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700"
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
