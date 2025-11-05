<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { Card, Button, LoadingButton } from '$lib';
	import { useToast, useFieldValidation, validators } from '$lib';
	import { APP_CONSTANTS, ROUTES } from '$lib/constants/app.constants';

	let loading = $state(false);
	let success = $state(false);
	let error = $state('');
	let rateLimited = $state(false);
	let _rateLimitType = $state('');
	let cooldownSeconds = $state(0);

	const toast = useToast();

	// Form validation using existing patterns
	const emailField = useFieldValidation('', validators.email);

	// 쿨다운 타이머 관리
	let cooldownInterval: NodeJS.Timeout | null = null;

	function startCooldown(seconds: number) {
		cooldownSeconds = seconds;
		rateLimited = true;

		if (cooldownInterval) {
			clearInterval(cooldownInterval);
		}

		cooldownInterval = setInterval(() => {
			cooldownSeconds--;
			if (cooldownSeconds <= 0) {
				rateLimited = false;
				if (cooldownInterval) {
					clearInterval(cooldownInterval);
					cooldownInterval = null;
				}
			}
		}, 1000);
	}

	// 컴포넌트 정리 시 타이머 해제
	onDestroy(() => {
		if (cooldownInterval) {
			clearInterval(cooldownInterval);
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (loading) return;

		// Validate email field
		if (!emailField.validate()) {
			toast.warning('유효한 이메일 주소를 입력해주세요.');
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch(`${APP_CONSTANTS.API_BASE_URL}/auth/request-password-reset`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: emailField.value.trim() })
			});

			const data = await response.json();

			if (response.ok) {
				success = true;
				toast.success('비밀번호 재설정 링크가 전송되었습니다!');
			} else {
				// 레이트리밋 타입에 따른 더 구체적인 메시지 및 쿨다운 설정
				if (response.status === 429) {
					const errorType = data.type;
					_rateLimitType = errorType || 'GENERAL';

					if (errorType === 'EMAIL_RATE_LIMIT') {
						error = '해당 이메일로 너무 많은 요청이 있었습니다.';
						startCooldown(24 * 60 * 60); // 24시간
					} else if (errorType === 'IP_RATE_LIMIT') {
						error = '너무 많은 요청을 보내셨습니다.';
						startCooldown(60 * 60); // 1시간
					} else {
						error = data.message || '요청 제한에 도달했습니다.';
						startCooldown(60 * 60); // 기본 1시간
					}
				} else {
					error = data.message || '요청 처리 중 오류가 발생했습니다.';
				}
				toast.error(error);
			}
		} catch (err) {
			console.error('Password reset request error:', err);
			error = '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
			toast.error(error);
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		success = false;
		emailField.value = '';
		emailField.error = '';
		error = '';
	}
</script>

<svelte:head>
	<title>비밀번호 재설정 요청 - FlowAuth</title>
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
					<h2 class="mb-2 text-2xl font-bold text-gray-900">비밀번호 재설정 요청</h2>
					<p class="text-gray-600">
						{#if success}
							재설정 링크가 성공적으로 전송되었습니다
						{:else}
							가입 시 사용한 이메일 주소를 입력해주세요
						{/if}
					</p>
				</div>

				{#if success}
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
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>

						<div class="space-y-2">
							<h3 class="text-lg font-medium text-gray-900">이메일을 확인해주세요</h3>
							<p class="text-sm text-gray-600">
								<span class="font-medium">{emailField.value}</span>로<br />
								비밀번호 재설정 링크를 보냈습니다.<br />
								이메일을 확인하고 링크를 클릭해주세요.
							</p>
						</div>

						<div class="space-y-3">
							<Button variant="primary" class="w-full" onclick={resetForm}>
								<i class="fas fa-envelope mr-2"></i>
								다른 이메일로 재요청
							</Button>

							<Button variant="outline" class="w-full" onclick={() => goto(ROUTES.LOGIN)}>
								<i class="fas fa-arrow-left mr-2"></i>
								로그인 페이지로 돌아가기
							</Button>
						</div>

						<!-- 도움말 정보 -->
						<div class="rounded-lg bg-blue-50 p-4">
							<p class="text-xs text-blue-700">
								<i class="fas fa-info-circle mr-1"></i>
								<strong>이메일이 오지 않나요?</strong><br />
								스팸함을 확인하거나 몇 분 후 다시 시도해주세요.<br />
								재설정 링크는 보안상 1시간 후 만료됩니다.
							</p>
						</div>
					</div>
				{:else}
					<div class="text-left">
						<form onsubmit={handleSubmit} class="space-y-6">
							<!-- 이메일 입력 -->
							<div>
								<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
									<i class="fas fa-envelope mr-2 text-blue-500"></i>이메일 주소<span
										class="text-red-500">*</span
									>
								</label>
								<input
									id="email"
									type="email"
									bind:value={emailField.value}
									oninput={() => emailField.validate()}
									required
									class="relative block w-full appearance-none border px-3 py-2 {emailField.error
										? 'border-red-300'
										: 'border-gray-300'} rounded-md text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
									placeholder="example@email.com"
								/>
								{#if emailField.error}
									<p class="mt-1 text-sm text-red-600">
										<i class="fas fa-exclamation-circle mr-1"></i>
										{emailField.error}
									</p>
								{/if}
							</div>

							<!-- 오류 메시지 -->
							{#if error}
								<div class="rounded-md border border-red-200 bg-red-50 p-3">
									<div class="flex">
										<svg
											class="h-5 w-5 text-red-400"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
											/>
										</svg>
										<div class="ml-2">
											<p class="text-sm text-red-700">{error}</p>
											{#if rateLimited && cooldownSeconds > 0}
												<div class="mt-2 text-xs text-red-600">
													<div class="flex items-center">
														<svg
															class="mr-1 h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
														<span>
															{#if cooldownSeconds >= 3600}
																{Math.floor(cooldownSeconds / 3600)}시간 {Math.floor(
																	(cooldownSeconds % 3600) / 60
																)}분 후 재시도 가능
															{:else if cooldownSeconds >= 60}
																{Math.floor(cooldownSeconds / 60)}분 {cooldownSeconds % 60}초 후
																재시도 가능
															{:else}
																{cooldownSeconds}초 후 재시도 가능
															{/if}
														</span>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/if}

							<!-- 제출 버튼 -->
							<div class="space-y-4">
								<LoadingButton
									type="submit"
									{loading}
									loadingText="전송 중..."
									class="w-full"
									disabled={!emailField.value || !!emailField.error || loading || rateLimited}
								>
									<i class="fas fa-paper-plane mr-2"></i>
									{#if rateLimited && cooldownSeconds > 0}
										{#if cooldownSeconds >= 3600}
											{Math.floor(cooldownSeconds / 3600)}시간 {Math.floor(
												(cooldownSeconds % 3600) / 60
											)}분 후 재시도
										{:else if cooldownSeconds >= 60}
											{Math.floor(cooldownSeconds / 60)}분 {cooldownSeconds % 60}초 후 재시도
										{:else}
											{cooldownSeconds}초 후 재시도
										{/if}
									{:else}
										비밀번호 재설정 링크 전송
									{/if}
								</LoadingButton>

								<Button variant="outline" class="w-full" onclick={() => goto(ROUTES.LOGIN)}>
									<i class="fas fa-arrow-left mr-2"></i>
									로그인 페이지로 돌아가기
								</Button>
							</div>
						</form>

						<!-- 보안 안내 -->
						<div class="mt-6 rounded-lg bg-gray-50 p-4">
							<p class="text-xs text-gray-600">
								<i class="fas fa-shield-alt mr-1 text-blue-500"></i>
								<strong>보안 정보</strong><br />
								• 비밀번호 재설정 링크는 보안을 위해 1시간 후 자동으로 만료됩니다<br />
								• 과도한 요청 방지를 위해 IP당 1시간에 2회, 이메일당 24시간에 5회로 제한됩니다<br />
								• 계정에 등록된 이메일이 아닌 경우에도 보안상 동일한 메시지가 표시됩니다
							</p>
						</div>
					</div>
				{/if}

				{#if !success}
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
