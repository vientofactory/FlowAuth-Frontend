<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import LoadingState from '$lib/components/oauth2/LoadingState.svelte';
	import ErrorState from '$lib/components/oauth2/ErrorState.svelte';
	import AccountSwitcher from '$lib/components/oauth2/AccountSwitcher.svelte';
	import { ROUTES } from '$lib/constants/app.constants';
	import Logo from '$lib/components/Logo.svelte';
	import { useAuthorization } from '$lib/hooks/useAuthorization';
	import type { AuthorizationState } from '$lib/types/authorization.types';
	import { ErrorType } from '$lib/types/authorization.types';
	import type { PageData } from './$types';
	import { env } from '$lib/config/env';
	import { getScopeInfo } from '$lib/utils/scope.utils';
	import { oidcStore } from '$lib/stores/oidc';
	import { LOCAL_STORAGE_KEYS, COOKIE_KEYS } from '@flowauth/shared';
	import { getCookie } from '$lib/utils/cookie';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faInfo, faInfoCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
	import { faCube } from '@fortawesome/free-solid-svg-icons';
	import './+page.css';

	let { data }: { data: PageData } = $props();

	// OAuth2 파라미터 누락 에러 처리
	const oauth2ParamError = data && 'error' in data && data.error;

	// 권한 부여 훅 및 상태: 파라미터가 정상일 때만 사용
	import type { Writable } from 'svelte/store';
	let authState: Writable<AuthorizationState> | null = null;
	let handleConsent: ((approved: boolean) => void) | null = null;
	let retryAuthorization: (() => void) | null = null;
	let loadAuthorizationData: (() => void) | null = null;
	let currentState = $state<AuthorizationState | null>(null);
	let unsubscribe: (() => void) | null = null;

	if (!oauth2ParamError && data && 'authorizeParams' in data) {
		({
			state: authState,
			handleConsent,
			retryAuthorization,
			loadAuthorizationData
		} = useAuthorization(data));
		unsubscribe = authState.subscribe((value: AuthorizationState) => {
			currentState = value;
		});
	}

	// 설명 표시 상태 관리
	let isDescriptionExpanded = $state(false);

	// 설명 중략 처리 설정
	const DESCRIPTION_MAX_LENGTH = 80; // 모바일에서 약 3-4줄
	const DESCRIPTION_PREVIEW_LENGTH = 20; // 미리보기 길이

	// 로고 URL을 리액티브하게 계산 (파라미터 에러 시 null)
	let logoUrl = $derived(
		!oauth2ParamError && currentState?.client ? getLogoUrl(currentState.client.logoUri) : null
	);

	// 스코프 아이콘 색상 클래스 가져오기 함수
	function getScopeColorClasses(color: string) {
		const colorMap = {
			blue: 'bg-stone-100 text-stone-600',
			orange: 'bg-neutral-100 text-neutral-600',
			green: 'bg-gray-100 text-gray-600',
			purple: 'bg-slate-100 text-slate-600',
			indigo: 'bg-zinc-100 text-zinc-600',
			red: 'bg-neutral-100 text-neutral-600',
			gray: 'bg-gray-100 text-gray-600',
			cyan: 'bg-stone-100 text-stone-600'
		};

		return colorMap[color as keyof typeof colorMap] || colorMap.gray;
	}

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
		if (!logoUri || !logoUri.trim()) {
			return null;
		}

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

	// Function to check if description needs truncation
	function needsTruncation(description?: string): boolean {
		return (description?.length || 0) > DESCRIPTION_MAX_LENGTH;
	}

	// Function to get truncated description
	function getTruncatedDescription(description?: string): string {
		if (!description) return '';
		if (description.length <= DESCRIPTION_MAX_LENGTH) return description;

		// 단어 경계에서 자르기 위해 공백을 찾음
		const truncated = description.substring(0, DESCRIPTION_PREVIEW_LENGTH);
		const lastSpace = truncated.lastIndexOf(' ');

		// 마지막 공백이 너무 앞쪽에 있으면 그냥 문자 기준으로 자름
		if (lastSpace < DESCRIPTION_PREVIEW_LENGTH * 0.8) {
			return truncated + '...';
		}

		return description.substring(0, lastSpace) + '...';
	}

	// Function to get display description based on expanded state
	function getDisplayDescription(description?: string): string {
		if (!description) return '';

		if (!needsTruncation(description) || isDescriptionExpanded) {
			return description;
		}

		return getTruncatedDescription(description);
	}

	// Function to toggle description expansion
	function toggleDescription() {
		isDescriptionExpanded = !isDescriptionExpanded;
	}

	onMount(() => {
		// 인증 상태 확인
		const hasToken =
			localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_TOKEN) ||
			localStorage.getItem(LOCAL_STORAGE_KEYS.OAUTH2_TOKEN) ||
			getCookie(COOKIE_KEYS.TOKEN);

		if (!hasToken) {
			// 토큰이 없으면 직접 로그인 페이지로 리디렉트
			console.log('[Page] No authentication token found, redirecting to login');
			const currentUrl = window.location.href;
			const loginUrl = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(currentUrl)}`;
			window.location.href = loginUrl;
			return;
		} // OIDC 파라미터가 있는 경우 nonce와 state 생성
		const urlParams = new URLSearchParams(window.location.search);
		const responseType = urlParams.get('response_type');

		if (responseType && (responseType.includes('id_token') || responseType === 'code')) {
			oidcStore.generateAndStoreNonce();
		}

		console.log('[Page] Component mounted, starting authorization data load');
		if (loadAuthorizationData) loadAuthorizationData();

		// 추가 안전장치: 45초 후에도 로딩 중이면 강제로 에러 상태로 전환
		setTimeout(() => {
			if (authState) {
				authState.update((current) => {
					const curr = current as AuthorizationState;
					if (curr.loading) {
						console.error('[Page] Force timeout: loading took too long');
						return {
							...curr,
							loading: false,
							error: {
								type: ErrorType.TIMEOUT_ERROR,
								message: '보안 검증이 예상보다 오래 걸리고 있습니다. 페이지를 새로고침해주세요.',
								retryable: false
							}
						};
					}
					return curr;
				});
			}
		}, 45000);

		return unsubscribe;
	});

	// 이벤트 핸들러
	function handleApprove() {
		if (handleConsent) handleConsent(true);
	}

	function handleDeny() {
		if (handleConsent) handleConsent(false);
	}

	function handleRetry() {
		if (retryAuthorization) retryAuthorization();
	}

	function handleGoBack() {
		window.history.back();
	}

	// 계정 전환 시 콜백
	function handleAccountSwitch() {
		console.log('[OAuth2 Page] Account switch initiated');
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-stone-50 to-gray-50 p-4"
	role="main"
	aria-labelledby="authorize-heading"
>
	<div class="w-full max-w-md">
		{#if oauth2ParamError}
			<Card class="border-red-200 bg-white/95 shadow-xl backdrop-blur-sm">
				<div class="p-8 text-center">
					<FontAwesomeIcon icon={faInfoCircle} class="mb-4 text-3xl text-red-400" />
					<h2 class="mb-2 text-lg font-bold text-red-700">잘못된 요청</h2>
					<p class="mb-4 text-sm text-gray-700">{oauth2ParamError.message}</p>
					<button
						class="mt-2 rounded bg-stone-600 px-4 py-2 text-white hover:bg-stone-700"
						onclick={() => (window.location.href = '/')}
					>
						홈으로 이동
					</button>
				</div>
			</Card>
		{:else if currentState?.loading}
			<Card class="border-0 bg-white/95 shadow-xl backdrop-blur-sm">
				<!-- 로딩 중에도 계정 정보 표시 -->
				<AccountSwitcher
					currentUser={currentState.currentUser}
					loading={currentState.currentUser === null}
					onAccountSwitch={handleAccountSwitch}
				/>
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
				<!-- 에러 상태에서도 계정 정보 표시 -->
				<AccountSwitcher
					currentUser={currentState.currentUser}
					loading={false}
					onAccountSwitch={handleAccountSwitch}
				/>
				<div class="animate-fadeIn" style="animation-delay: 0.1s;">
					<ErrorState error={currentState.error} onRetry={handleRetry} onGoBack={handleGoBack} />
				</div>
			</Card>
		{:else if currentState?.client}
			<Card
				class="animate-scaleIn max-w-lg overflow-hidden border-0 bg-white/95 shadow-xl backdrop-blur-sm"
			>
				<!-- 현재 로그인된 계정 정보 -->
				<AccountSwitcher
					currentUser={currentState.currentUser}
					loading={false}
					onAccountSwitch={handleAccountSwitch}
				/>

				<!-- 앱 정보 헤더 -->
				<div class="animate-fadeIn border-b border-gray-100 px-8 py-6 text-center">
					<div class="flex flex-col items-center space-y-4">
						<!-- 앱 로고 표시 -->
						<div class="relative">
							<Logo
								src={logoUrl || ''}
								alt="{currentState.client?.name || 'FlowAuth'} 로고"
								size="lg"
								fallbackSrc="/logo_icon.png"
								fallbackIcon={faCube}
								useIconFallback={logoUrl === null}
								className="rounded-full border-2 border-white shadow-lg object-cover"
							/>
						</div>

						<!-- 앱 이름과 설명 -->
						<div>
							<h1 class="mb-1 text-xl font-bold text-gray-900">
								{currentState.client?.name || '알 수 없는 앱'}
							</h1>
							{#if currentState.client?.description}
								<div class="mb-1 flex flex-col items-center space-y-1">
									<p class="text-sm leading-relaxed text-gray-700">
										{getDisplayDescription(currentState.client.description)}
									</p>
									{#if needsTruncation(currentState.client.description)}
										<button
											onclick={toggleDescription}
											class="text-xs text-stone-600 transition-colors hover:text-stone-800 focus:outline-none"
										>
											{isDescriptionExpanded ? '간략히 보기' : '더 보기'}
										</button>
									{/if}
								</div>
							{/if}
							<p class="text-sm text-gray-600">귀하의 계정에 접근하려고 합니다</p>
						</div>
					</div>
				</div>

				<!-- 권한 목록 -->
				<div class="animate-slideInUp px-8 py-6">
					<h3 class="mb-4 text-center text-sm font-semibold text-gray-900">
						이 앱이 요청하는 권한
					</h3>

					{#if currentState.scopes && currentState.scopes.length > 0}
						<div class="space-y-3">
							{#each currentState.scopes as scope, _index (scope)}
								{@const scopeInfo = getScopeInfo(scope)}
								<div class="transition-hover flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {getScopeColorClasses(
											scopeInfo.color
										)}"
									>
										<FontAwesomeIcon icon={scopeInfo.icon} class="text-sm" />
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">
											{scopeInfo.name}
										</p>
										<p class="text-xs text-gray-600">
											{scopeInfo.description}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-4 text-center">
							<div class="mb-3 flex items-center justify-center">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
									<FontAwesomeIcon icon={faInfo} class="text-gray-400" />
								</div>
							</div>
							<p class="text-sm text-gray-500">이 앱은 특별한 권한을 요청하지 않습니다</p>
							<p class="mt-1 text-xs text-gray-400">기본적인 인증 정보만 사용됩니다</p>
						</div>
					{/if}

					<!-- 보안 알림 -->
					<div class="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
						<div class="flex items-start space-x-2">
							<FontAwesomeIcon icon={faInfoCircle} class="mt-0.5 text-sm text-stone-600" />
							<div>
								<p class="mb-1 text-sm font-medium text-stone-800">
									신뢰할 수 있는 앱인지 확인하세요
								</p>
								<p class="text-xs text-stone-700">
									승인 후 앱이 귀하의 데이터에 접근할 수 있습니다
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- 액션 버튼 -->
				<div class="animate-fadeIn border-t border-gray-100 bg-gray-50 px-8 py-6">
					<div class="space-y-4">
						<div class="flex space-x-3">
							<button
								onclick={handleDeny}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
							>
								취소
							</button>
							<button
								onclick={handleApprove}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-transparent bg-stone-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
							>
								{#if currentState.submitting}
									<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
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
								{#if currentState.client.termsOfServiceUri}
									<a
										href={currentState.client.termsOfServiceUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-stone-700 transition-colors hover:text-stone-900"
									>
										이용약관
									</a>
								{:else}
									이용약관
								{/if}
								과
								{#if currentState.client.policyUri}
									<a
										href={currentState.client.policyUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-stone-700 transition-colors hover:text-stone-900"
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
		<div class="animate-fadeIn mt-6 text-center">
			<div class="mb-3 flex items-center justify-center">
				<img
					src="/logo_icon.png"
					alt="FlowAuth 로고"
					class="mr-1 h-6 w-6 rounded-md object-cover transition-transform hover:scale-110"
					loading="lazy"
				/>
				<span class="text-sm font-medium text-gray-600">FlowAuth</span>
			</div>
			<p class="mb-2 text-xs text-gray-500">오픈소스 OAuth 2.0 통합 인증 시스템</p>
			<div class="flex items-center justify-center space-x-4 text-xs text-gray-400">
				<a
					href="/about"
					class="transition-colors hover:text-gray-600"
					target="_blank"
					rel="noopener noreferrer"
				>
					서비스 소개
				</a>
				<span>•</span>
				<a
					href="/terms"
					class="transition-colors hover:text-gray-600"
					target="_blank"
					rel="noopener noreferrer"
				>
					이용약관
				</a>
				<span>•</span>
				<a
					href="/privacy"
					class="transition-colors hover:text-gray-600"
					target="_blank"
					rel="noopener noreferrer"
				>
					개인정보처리방침
				</a>
			</div>
		</div>
	</div>
</div>
