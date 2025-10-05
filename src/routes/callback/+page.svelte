<script lang="ts">
	import { Button, Loading } from '$lib';
	import Footer from '$lib/components/Footer.svelte';
	import { useToast } from '$lib';
	import OAuthCallbackHandler from '$lib/components/oauth/OAuthCallbackHandler.svelte';
	import TokenExchangeForm from '$lib/components/oauth/TokenExchangeForm.svelte';
	import TokenInfoModal from '$lib/components/oauth/TokenInfoModal.svelte';
	import UserProfileCard from '$lib/components/oauth/UserProfileCard.svelte';
	import { type TokenInfo as JWTTokenInfo } from '$lib/utils/jwt-utils';

	// URL 파라미터에서 코드와 상태 추출
	let authCode = $state('');
	let oauthNonce = $state('');
	let error = $state('');
	let isLoading = $state(true);

	// 토큰 교환 폼
	let tokenForm = $state({
		clientId: '',
		clientSecret: '',
		code: '',
		redirectUri: '',
		codeVerifier: '',
		grantType: 'authorization_code'
	});

	// 토큰 응답 타입 정의
	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface _UserProfile {
		sub: string;
		email?: string;
		username?: string;
		roles?: string[];
	}

	// 응답 데이터
	let tokenResponse: TokenResponse | null = $state(null);
	let isExchanging = $state(false);
	let showTokenModal = $state(false);

	// 토큰 테스트 관련
	let _tokenInfo: JWTTokenInfo | null = $state(null);
	let idTokenInfo: JWTTokenInfo | null = $state(null);
	let activeTab = $state('token'); // 'token', 'profile', 'test'

	const toast = useToast();

	function navigateBack() {
		window.location.href = '/dashboard/oauth-tester';
	}

	function goToDashboard() {
		window.location.href = '/dashboard';
	}

	// 토큰 정보 디코딩 (jwt-utils에서 import한 함수 사용)
</script>

<svelte:head>
	<title>OAuth2 콜백 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="처리 중..." />
	</div>
{:else}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={navigateBack}
							class="text-gray-600 hover:text-gray-900"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							OAuth2 테스터로
						</Button>
						<div class="h-6 w-px bg-gray-300"></div>
						<h1 class="text-xl font-semibold text-gray-900">OAuth2 콜백</h1>
					</div>
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={goToDashboard}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-home mr-2"></i>
							대시보드로
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 페이지 헤더 -->
				<div>
					<h2 class="text-2xl font-bold text-gray-900">OAuth2 인증 콜백</h2>
					<p class="mt-1 text-sm text-gray-600">인증 코드를 액세스 토큰으로 교환하세요.</p>
				</div>

				<!-- OAuth 콜백 핸들러 컴포넌트 -->
				<OAuthCallbackHandler
					onCallbackProcessed={(data) => {
						authCode = data.authCode;
						oauthState = data.oauthState;
						oauthNonce = data.oauthNonce;
						error = data.error;
						isLoading = false;

						// Implicit Grant 토큰이 있는 경우
						if (data.implicitAccessToken || data.implicitIdToken) {
							tokenResponse = {
								access_token: data.implicitAccessToken || '',
								token_type: 'Bearer',
								expires_in: 3600,
								id_token: data.implicitIdToken || undefined
							};
						}

						// 현재 URL에서 redirect_uri 추출
						tokenForm.redirectUri = window.location.origin + window.location.pathname;

						// 폼에 코드 설정
						if (authCode) {
							tokenForm.code = authCode;
						}

						// 세션 스토리지에서 code_verifier 가져오기
						const storedCodeVerifier = sessionStorage.getItem('code_verifier');
						if (storedCodeVerifier) {
							tokenForm.codeVerifier = storedCodeVerifier;
						}
					}}
				/>

				<!-- 토큰 교환 폼 컴포넌트 -->
				{#if authCode && !error}
					<TokenExchangeForm
						bind:tokenForm
						bind:tokenResponse
						bind:isExchanging
						bind:showTokenModal
						{toast}
					/>
				{/if}

				<!-- 토큰 정보 모달 -->
				<TokenInfoModal
					open={showTokenModal}
					{tokenResponse}
					{oauthNonce}
					onClose={() => (showTokenModal = false)}
				/>

				<!-- 사용자 프로필 카드 -->
				{#if tokenResponse && activeTab === 'profile'}
					<UserProfileCard tokenInfo={idTokenInfo} />
				{/if}
			</div>
		</main>
	</div>
{/if}

<!-- 푸터 -->
<Footer />
