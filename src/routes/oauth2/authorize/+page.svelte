<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import LoadingState from '$lib/components/oauth2/LoadingState.svelte';
	import ErrorState from '$lib/components/oauth2/ErrorState.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { useAuthorization } from '$lib/hooks/useAuthorization';
	import type { AuthorizationState } from '$lib/types/authorization.types';
	import { ErrorType } from '$lib/types/authorization.types';
	import type { PageData } from './$types';
	import { env } from '$lib/config/env';

	let { data }: { data: PageData } = $props();

	// 권한 부여 훅 사용
	const {
		state: authState,
		handleConsent,
		retryAuthorization,
		loadAuthorizationData
	} = useAuthorization(data);

	// 상태 구독
	let currentState = $state<AuthorizationState | null>(null);
	const unsubscribe = authState.subscribe((value) => {
		currentState = value;
	});

	// Function to extract host from redirect URI
	function getRedirectHost(redirectUri?: string): string {
		if (!redirectUri) return 'N/A';
		try {
			const url = new URL(redirectUri);
			return `${url.protocol}//${url.host}`;
		} catch {
			return 'N/A';
		}
	}

	// Function to convert logo URI to absolute URL
	function getLogoUrl(logoUri?: string): string | null {
		if (!logoUri || !logoUri.trim()) return null;
		
		const trimmedUri = logoUri.trim();
		
		// 빈 문자열이나 placeholder 값인 경우 null 반환
		if (trimmedUri === '' || trimmedUri === 'null' || trimmedUri === 'undefined') {
			return null;
		}
		
		// 상대 경로인 경우 백엔드 호스트를 붙임
		if (trimmedUri.startsWith('/uploads/')) {
			return `${env.API_BASE_URL}${trimmedUri}`;
		}
		
		// 이미 절대 URL인 경우 그대로 반환
		try {
			new URL(trimmedUri);
			return trimmedUri;
		} catch {
			// 유효하지 않은 URL인 경우 null 반환
			return null;
		}
	}

	onMount(() => {
		console.log('[Page] Component mounted, starting authorization data load');
		loadAuthorizationData();

		// 추가 안전장치: 45초 후에도 로딩 중이면 강제로 에러 상태로 전환
		setTimeout(() => {
			authState.update((current) => {
				if (current.loading) {
					console.error('[Page] Force timeout: loading took too long');
					return {
						...current,
						loading: false,
						error: {
							type: ErrorType.TIMEOUT_ERROR,
							message: '보안 검증이 예상보다 오래 걸리고 있습니다. 페이지를 새로고침해주세요.',
							retryable: false
						}
					};
				}
				return current;
			});
		}, 45000);

		return unsubscribe;
	});

	// 이벤트 핸들러
	function handleApprove() {
		handleConsent(true);
	}

	function handleDeny() {
		handleConsent(false);
	}

	function handleRetry() {
		retryAuthorization();
	}

	function handleGoBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4"
	role="main"
	aria-labelledby="authorize-heading"
>
	<div class="w-full max-w-md">
		{#if currentState?.loading}
			<Card class="border-0 bg-white/95 shadow-xl backdrop-blur-sm">
				<LoadingState
					message={currentState.loadingProgress < 50
						? '보안 검증을 준비하고 있습니다...'
						: currentState.loadingProgress < 80
							? '클라이언트 정보를 확인하고 있습니다...'
							: '권한 정보를 불러오고 있습니다...'}
					progress={currentState.loadingProgress}
				/>
			</Card>
		{:else if currentState?.error}
			<Card class="border-red-200 bg-white/95 shadow-xl backdrop-blur-sm">
				<ErrorState error={currentState.error} onRetry={handleRetry} onGoBack={handleGoBack} />
			</Card>
		{:else if currentState?.client}
			<Card class="max-w-lg overflow-hidden border-0 bg-white/95 shadow-xl backdrop-blur-sm">
				<!-- 앱 정보 헤더 -->
				<div class="border-b border-gray-100 px-8 py-6 text-center">
					<div class="flex flex-col items-center space-y-4">
						<!-- 앱 로고 표시 -->
						<div class="relative">
							{#if getLogoUrl(currentState.client?.logoUri)}
								<!-- 클라이언트 제공 로고 우선 사용 -->
								<Logo
									src={getLogoUrl(currentState.client?.logoUri) || ''}
									alt="{currentState.client?.name} 로고"
									size="lg"
									fallbackSrc="/logo_icon.png"
									className="rounded-full border-2 border-white shadow-lg object-cover"
								/>
							{:else}
								<!-- 백엔드 기본 로고 사용 -->
								<Logo
									size="lg"
									alt="FlowAuth 로고"
									fallbackSrc="/logo_icon.png"
									className="rounded-full border-2 border-white shadow-lg object-cover"
								/>
							{/if}
						</div>

						<!-- 앱 이름과 설명 -->
						<div>
							<h1 class="mb-1 text-xl font-bold text-gray-900">
								{currentState.client?.name || '알 수 없는 앱'}
							</h1>
							<p class="text-sm text-gray-600">귀하의 계정에 접근하려고 합니다</p>
						</div>
					</div>
				</div>

				<!-- 권한 목록 -->
				<div class="px-8 py-6">
					<h3 class="mb-4 text-center text-sm font-semibold text-gray-900">
						이 앱이 요청하는 권한
					</h3>

					<div class="space-y-3">
						{#each currentState.scopes || [] as scope (scope)}
							<div class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
								>
									<i class="fas fa-check text-sm text-green-600"></i>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900 capitalize">
										{scope.replace(/_/g, ' ')}
									</p>
									<p class="text-xs text-gray-600">
										앱이 {scope.replace(/_/g, ' ')} 권한을 사용할 수 있습니다
									</p>
								</div>
							</div>
						{/each}
					</div>

					<!-- 보안 알림 -->
					<div class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<div class="flex items-start space-x-2">
							<i class="fas fa-info-circle mt-0.5 text-sm text-amber-600"></i>
							<div>
								<p class="mb-1 text-sm font-medium text-amber-800">
									신뢰할 수 있는 앱인지 확인하세요
								</p>
								<p class="text-xs text-amber-700">
									승인 후 앱이 귀하의 데이터에 접근할 수 있습니다
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- 액션 버튼 -->
				<div class="border-t border-gray-100 bg-gray-50 px-8 py-6">
					<div class="space-y-4">
						<div class="flex space-x-3">
							<button
								onclick={handleDeny}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								취소
							</button>
							<button
								onclick={handleApprove}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-transparent bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if currentState.submitting}
									<i class="fas fa-spinner fa-spin mr-2"></i>
									승인 중...
								{:else}
									승인
								{/if}
							</button>
						</div>

						<!-- Redirect URL 표시 -->
						<div class="text-center">
							<p class="text-xs text-gray-500">
								승인 시 다음 사이트로 이동합니다:
								<span class="break-all text-gray-700">
									{getRedirectHost(data.authorizeParams?.redirect_uri)}
								</span>
							</p>
							<p class="text-xs text-gray-500">
								애플리케이션의
								{#if currentState.client?.termsOfServiceUri}
									<a
										href={currentState.client.termsOfServiceUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-700 hover:text-blue-900"
									>
										이용약관
									</a>
								{:else}
									이용약관
								{/if}
								과
								{#if currentState.client?.policyUri}
									<a
										href={currentState.client.policyUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-700 hover:text-blue-900"
									>
										개인정보처리방침
									</a>
								{:else}
									개인정보처리방침
								{/if}
								이 적용됩니다.
							</p>
						</div>
					</div>
				</div>
			</Card>
		{/if}

		<!-- OAuth2 플랫폼 정보 -->
		<div class="mt-6 text-center">
			<div class="mb-3 flex items-center justify-center">
				<Logo
					size="sm"
					alt="FlowAuth 로고"
					fallbackSrc="/logo_icon.png"
					className="rounded-md"
				/>
				<span class="text-sm font-medium text-gray-600">FlowAuth</span>
			</div>
			<p class="mb-2 text-xs text-gray-500">
				오픈소스 OAuth 2.0 통합 인증 시스템
			</p>
			<div class="flex items-center justify-center space-x-4 text-xs text-gray-400">
				<a
					href="/about"
					class="hover:text-gray-600 transition-colors"
					target="_blank"
					rel="noopener noreferrer"
				>
					서비스 소개
				</a>
				<span>•</span>
				<a
					href="/terms"
					class="hover:text-gray-600 transition-colors"
					target="_blank"
					rel="noopener noreferrer"
				>
					이용약관
				</a>
				<span>•</span>
				<a
					href="/privacy"
					class="hover:text-gray-600 transition-colors"
					target="_blank"
					rel="noopener noreferrer"
				>
					개인정보처리방침
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	/* 모바일 최적화 */
	@media (max-width: 640px) {
		/* 버튼 터치 타겟 개선 */
		button {
			min-height: 44px;
		}
	}
</style>
