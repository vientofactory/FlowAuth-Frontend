<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { Client } from '$lib/types/oauth.types';
	import type { PageData } from './$types';

	export let data: PageData;

	// Component state
	let loading = true;
	let submitting = false;
	let error = '';
	let client: Client | null = null;
	let requestedScopes: string[] = [];

	// Scope descriptions with better icons and descriptions
	const scopeDescriptions: Record<string, { icon: string; description: string; category: string }> = {
		read: {
			icon: 'fas fa-eye',
			description: '귀하의 기본 프로필 정보를 읽을 수 있습니다',
			category: '읽기'
		},
		write: {
			icon: 'fas fa-edit',
			description: '귀하의 계정 정보를 수정할 수 있습니다',
			category: '쓰기'
		},
		profile: {
			icon: 'fas fa-user',
			description: '이름, 프로필 사진 등의 개인정보에 접근할 수 있습니다',
			category: '프로필'
		},
		email: {
			icon: 'fas fa-envelope',
			description: '귀하의 이메일 주소에 접근할 수 있습니다',
			category: '연락처'
		},
		openid: {
			icon: 'fas fa-shield-alt',
			description: 'OpenID Connect 표준을 통한 안전한 인증을 제공합니다',
			category: '인증'
		},
		offline_access: {
			icon: 'fas fa-clock',
			description: '로그인 상태를 유지하여 재인증 없이 사용할 수 있습니다',
			category: '접근성'
		}
	};

	onMount(async () => {
		// Parameters are already extracted from +page.ts
		const { authorizeParams } = data;

		if (
			!authorizeParams.client_id ||
			!authorizeParams.redirect_uri ||
			!authorizeParams.response_type
		) {
			error = '필수 OAuth2 파라미터가 누락되었습니다';
			loading = false;
			return;
		}

		try {
			// 디버그 정보 출력
			apiClient.debugToken();

			// Get consent information from backend using API client
			const params = new URLSearchParams({
				client_id: authorizeParams.client_id,
				redirect_uri: authorizeParams.redirect_uri,
				response_type: authorizeParams.response_type,
				...(authorizeParams.scope && { scope: authorizeParams.scope }),
				...(authorizeParams.state && { state: authorizeParams.state }),
				...(authorizeParams.code_challenge && { code_challenge: authorizeParams.code_challenge }),
				...(authorizeParams.code_challenge_method && {
					code_challenge_method: authorizeParams.code_challenge_method
				})
			});

			const result = await apiClient.request<{ client: Client; scopes: string[] }>(
				`/oauth2/authorize/info?${params.toString()}`,
				{ method: 'GET' }
			);

			client = result.client;
			requestedScopes = result.scopes;
		} catch (err) {
			console.error('Authorization validation error:', err);
			error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});

	async function handleConsent(approved: boolean) {
		if (submitting) return;

		submitting = true;
		error = '';

		try {
			const consentData = {
				...data.authorizeParams,
				approved
			};

			const result = await apiClient.request<{ redirect_url: string }>(
				'/oauth2/authorize/consent',
				{
					method: 'POST',
					body: JSON.stringify(consentData)
				}
			);

			// Redirect to the client application
			window.location.href = result.redirect_url;
		} catch (err) {
			console.error('Consent error:', err);
			error = err instanceof Error ? err.message : '동의 처리 중 오류가 발생했습니다';
		} finally {
			submitting = false;
		}
	}

	function handleApprove() {
		handleConsent(true);
	}

	function handleDeny() {
		handleConsent(false);
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4"
>
	<div class="w-full max-w-lg h-auto max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] lg:max-h-[75vh] flex items-center">
		{#if loading}
			<Card class="text-center shadow-2xl oauth-card w-full">
				<div class="mb-4 sm:mb-6">
					<div class="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
						<i class="fas fa-shield-alt text-2xl sm:text-3xl text-white animate-pulse"></i>
					</div>
					<h2 class="mb-2 text-lg sm:text-xl font-bold text-gray-900">보안 검증 중</h2>
				</div>
				<Loading />
				<p class="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 animate-pulse">인가 요청을 검증하고 있습니다...</p>
			</Card>
		{:else if error}
			<Card class="text-center shadow-2xl border-red-200 oauth-card w-full">
				<div class="mb-4 sm:mb-6">
					<div class="mx-auto mb-3 sm:mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 shadow-lg">
						<i class="fas fa-exclamation-triangle text-2xl sm:text-3xl text-white"></i>
					</div>
					<h2 class="mb-2 text-lg sm:text-xl font-bold text-gray-900">인가 오류</h2>
				</div>
				<p class="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 leading-relaxed">{error}</p>
				<Button variant="secondary" onclick={() => window.history.back()} class="shadow-lg hover:shadow-xl transition-shadow duration-200 oauth-button text-sm sm:text-base">
					<i class="fas fa-arrow-left mr-2"></i>
					뒤로 가기
				</Button>
			</Card>
		{:else if client}
			<Card class="shadow-2xl border-0 bg-white/90 backdrop-blur-sm oauth-card w-full h-full flex flex-col overflow-hidden">
				<!-- Fixed Header Section -->
				<div class="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
					<div class="text-center">
						<div class="relative mb-3 sm:mb-4">
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-xl"></div>
							</div>
							<div class="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white shadow-lg mx-auto">
								<i class="fas fa-shield-alt text-2xl sm:text-3xl text-indigo-600"></i>
							</div>
						</div>
						<h1 class="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
							애플리케이션 인가
						</h1>
						<div class="inline-flex items-center rounded-full bg-indigo-100 px-2 sm:px-3 py-1 sm:py-1.5">
							<p class="text-indigo-800 font-medium text-xs sm:text-sm">
								<strong class="text-indigo-900">{client.name}</strong>이(가) 액세스를 요청합니다
							</p>
						</div>
					</div>
				</div>

				<!-- Scrollable Content Area -->
				<div class="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
					{#if client.description}
						<div class="mb-4 sm:mb-6 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 shadow-sm">
							<div class="flex items-start space-x-2 sm:space-x-3">
								<div class="flex-shrink-0">
									<div class="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-blue-100">
										<i class="fas fa-info-circle text-blue-600 text-sm"></i>
									</div>
								</div>
								<div>
									<h3 class="mb-1 sm:mb-2 font-semibold text-gray-900 text-sm sm:text-base">애플리케이션 정보</h3>
									<p class="text-gray-700 leading-relaxed text-xs sm:text-sm">{client.description}</p>
								</div>
							</div>
						</div>
					{/if}

					{#if requestedScopes.length > 0}
						<div class="mb-4 sm:mb-6">
							<div class="mb-2 sm:mb-3 flex items-center">
								<i class="fas fa-key mr-1 sm:mr-2 text-lg sm:text-xl text-indigo-600"></i>
								<h3 class="font-bold text-gray-900 text-base sm:text-lg">요청된 권한</h3>
							</div>
							<div class="space-y-2 sm:space-y-3">
								{#each requestedScopes as scopeName (scopeName)}
									{@const scopeInfo = scopeDescriptions[scopeName] || {
										icon: 'fas fa-question-circle',
										description: `${scopeName} 권한`,
										category: '기타'
									}}
									<div class="group flex items-start space-x-2 sm:space-x-3 rounded-md sm:rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 permission-card">
										<div class="flex-shrink-0">
											<div class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 shadow-sm">
												<i class="{scopeInfo.icon} text-white text-xs"></i>
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center space-x-1.5 sm:space-x-2 mb-0.5 sm:mb-1">
												<h4 class="font-semibold text-gray-900 text-xs sm:text-sm">{scopeName}</h4>
												<span class="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
													{scopeInfo.category}
												</span>
											</div>
											<p class="text-gray-600 leading-relaxed text-xs">{scopeInfo.description}</p>
										</div>
										<div class="flex-shrink-0">
											<div class="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-green-100">
												<i class="fas fa-check text-green-600 text-xs"></i>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Security Notice -->
					<div class="mb-4 sm:mb-6 rounded-md sm:rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-4 shadow-sm">
						<div class="flex items-start space-x-2 sm:space-x-3">
							<div class="flex-shrink-0">
								<div class="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-amber-100">
									<i class="fas fa-shield-alt text-amber-600 text-xs sm:text-sm"></i>
								</div>
							</div>
							<div class="flex-1">
								<h4 class="mb-1 font-semibold text-amber-900 text-xs sm:text-sm">보안 안내</h4>
								<div class="text-amber-800 leading-relaxed text-xs">
									<p class="mb-1">
										이 애플리케이션을 인가하면 요청된 권한으로 귀하의 계정에 액세스할 수 있습니다.
									</p>
									<p>
										언제든지 계정 설정에서 이 액세스 권한을 취소할 수 있습니다.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Fixed Footer Section -->
				<div class="flex-shrink-0 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
					<!-- Action Buttons -->
					<div class="mb-3 sm:mb-4">
						<div class="flex space-x-2 sm:space-x-3">
							<Button
								variant="secondary"
								class="flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 oauth-button"
								onclick={handleDeny}
								disabled={submitting}
							>
								{#if submitting}
									<Loading size="sm" />
								{:else}
									<i class="fas fa-times mr-1 sm:mr-2"></i>
								{/if}
								거부하기
							</Button>
							<Button
								variant="primary"
								class="flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 oauth-button"
								onclick={handleApprove}
								disabled={submitting}
							>
								{#if submitting}
									<Loading size="sm" />
								{:else}
									<i class="fas fa-check mr-1 sm:mr-2"></i>
								{/if}
								인가하기
							</Button>
						</div>
					</div>

					<!-- Footer Info -->
					<div class="text-center">
						<p class="text-xs text-gray-500 mb-2">
							<i class="fas fa-lock mr-1"></i>
							Powered by <strong class="text-indigo-600">FlowAuth</strong>
						</p>
						<div class="flex justify-center space-x-2 sm:space-x-3 text-xs text-gray-400">
							<a href="/privacy" class="hover:text-gray-600 transition-colors duration-200 underline">
								개인정보
							</a>
							<a href="/terms" class="hover:text-gray-600 transition-colors duration-200 underline">
								약관
							</a>
							<a href="/help" class="hover:text-gray-600 transition-colors duration-200 underline">
								도움말
							</a>
						</div>
					</div>
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	/* Smooth animations */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Apply animations to main elements */
	:global(.oauth-card) {
		animation: fadeInUp 0.6s ease-out;
	}

	/* Enhanced button hover effects */
	:global(.oauth-button) {
		position: relative;
		overflow: hidden;
	}

	:global(.oauth-button::before) {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	:global(.oauth-button:hover::before) {
		left: 100%;
	}

	/* Gradient text animation */
	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.bg-gradient-to-r {
		background-size: 200% 200%;
		animation: gradientShift 3s ease infinite;
	}

	/* Card hover effects */
	:global(.permission-card) {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.permission-card:hover) {
		transform: translateY(-2px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	/* Loading animation */
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* Backdrop blur support */
	.backdrop-blur-sm {
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		/* Improve touch scrolling */
		:global(.overflow-y-auto) {
			-webkit-overflow-scrolling: touch;
			scroll-behavior: smooth;
		}

		/* Better button touch targets */
		:global(.oauth-button) {
			min-height: 44px; /* iOS recommended touch target size */
			touch-action: manipulation;
		}

		/* Reduce motion for mobile performance */
		:global(.oauth-card) {
			animation-duration: 0.3s;
		}

		/* Optimize spacing for mobile */
		:global(.permission-card) {
			margin-bottom: 0.5rem;
		}

		/* Better text readability on mobile */
		:global(.text-xs) {
			line-height: 1.4;
		}
	}

	/* Tablet optimizations */
	@media (min-width: 641px) and (max-width: 1024px) {
		:global(.oauth-card) {
			max-width: 90vw;
		}
	}

	/* Desktop optimizations */
	@media (min-width: 1025px) {
		:global(.oauth-card) {
			max-width: 480px;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(.oauth-card) {
			border: 2px solid;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(.oauth-card),
		:global(.oauth-button),
		.bg-gradient-to-r {
			animation: none;
		}

		:global(.oauth-button) {
			transition: none;
		}
	}

	/* Safe area support for notched devices */
	@supports (padding: max(0px)) {
		:global(.oauth-card) {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
		}
	}
</style>
