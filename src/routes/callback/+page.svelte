<script lang="ts">
	import { Loading } from '$lib';
	import {
		CallbackHeader,
		AuthResultDisplay,
		ImplicitTokenDisplay,
		UsageGuideSection,
		TokenModal
	} from '$lib/components/callback';
	import Footer from '$lib/components/Footer.svelte';
	import TokenExchangeForm from '$lib/components/oauth/TokenExchangeForm.svelte';
	import { createApiUrl } from '$lib/config/env';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	// URL 파라미터에서 코드와 상태 추출 (Authorization Code Grant)
	let authCode = $state('');
	let oauthState = $state('');
	let _oauthNonce = $state('');
	let error = $state('');
	let isLoading = $state(true);

	// Implicit Grant에서 Fragment로 받은 토큰들
	let implicitTokens: TokenResponse | null = $state(null);
	let responseType = $state(''); // 어떤 response type인지 추적

	// 토큰 교환 폼
	let tokenForm = $state({
		clientId: '',
		clientSecret: '',
		code: '',
		redirectUri: 'http://localhost:5173/callback',
		codeVerifier: '',
		grantType: 'authorization_code' as const
	});

	// 로딩 타임아웃 설정
	let _loadingTimeout: ReturnType<typeof setTimeout> | null = null;

	interface UserProfile {
		sub: string;
		email?: string;
		username?: string;
		roles?: string[];
	}

	interface TokenInfo {
		header: {
			alg: string;
			typ: string;
			[key: string]: unknown;
		};
		payload: Record<string, unknown>;
		signature: string;
		issuedAt: Date | null;
		expiresAt: Date | null;
		isExpired: boolean;
	}

	// 응답 데이터
	let tokenResponse: TokenResponse | null = $state(null);
	let showTokenModal = $state(false);

	// 토큰 테스트 관련
	let isTestingToken = $state(false);
	let userProfile: UserProfile | null = $state(null);
	let tokenInfo: TokenInfo | null = $state(null);
	let idTokenInfo: TokenInfo | null = $state(null);
	let activeTab = $state('token'); // 'token', 'profile', 'test'
	let tokenAnalysisType = $state<'access' | 'id'>('access'); // 토큰 분석 타입

	const toast = useToast();

	onMount(() => {
		// 브라우저 환경 확인
		if (typeof window === 'undefined') {
			isLoading = false;
			return;
		}

		// URL 파라미터 파싱 (Authorization Code Grant)
		const urlParams = new URLSearchParams(window.location.search);
		authCode = urlParams.get('code') || '';
		oauthState = urlParams.get('state') || '';
		error = urlParams.get('error') || '';

		// URL Fragment 파싱 (Implicit Grant)
		const hash = window.location.hash.substring(1); // # 제거
		const fragmentParams = new URLSearchParams(hash);

		// Fragment에서 토큰 추출
		const accessToken = fragmentParams.get('access_token');
		const idToken = fragmentParams.get('id_token');
		const tokenType = fragmentParams.get('token_type');
		const expiresIn = fragmentParams.get('expires_in');
		const scope = fragmentParams.get('scope');
		const fragmentState = fragmentParams.get('state');
		const fragmentError = fragmentParams.get('error');

		// Response type 결정
		if (authCode) {
			responseType = 'code';
		} else if (accessToken && idToken) {
			responseType = 'token id_token';
		} else if (accessToken) {
			responseType = 'token';
		} else if (idToken) {
			responseType = 'id_token';
		}

		// Implicit Grant 처리
		if (accessToken || idToken) {
			implicitTokens = {
				access_token: accessToken || '',
				token_type: tokenType || 'Bearer',
				expires_in: expiresIn ? parseInt(expiresIn) : undefined,
				scope: scope || undefined,
				id_token: idToken || undefined
			};

			// Fragment의 state 사용
			if (fragmentState) {
				oauthState = fragmentState;
			}

			// 토큰을 성공적으로 받았으므로 토큰 응답으로 설정
			tokenResponse = implicitTokens;
			showTokenModal = true;
			activeTab = 'token';
		}

		// Fragment 에러 처리
		if (fragmentError) {
			error = fragmentError;
		}

		// 토큰 폼에 코드 설정 (Authorization Code Grant용)
		if (authCode) {
			tokenForm.code = authCode;
		}

		// 세션 스토리지에서 OAuth2 인증 요청 시 저장된 값들 복원
		const storedClientId = sessionStorage.getItem('client_id');
		const storedClientSecret = sessionStorage.getItem('client_secret');
		const storedCodeVerifier = sessionStorage.getItem('code_verifier');
		const storedRedirectUri = sessionStorage.getItem('redirect_uri');

		// 토큰 폼 초기화
		tokenForm = {
			clientId: storedClientId || '',
			clientSecret: storedClientSecret || '',
			code: authCode,
			redirectUri: storedRedirectUri || 'http://localhost:5173/callback',
			codeVerifier: storedCodeVerifier || '',
			grantType: 'authorization_code' as const
		};

		// 3초 후에도 로딩이 끝나지 않으면 강제로 로딩 해제
		_loadingTimeout = setTimeout(() => {
			if (isLoading) {
				isLoading = false;
				toast.error('콜백 처리 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
			}
		}, 3000);

		// 로딩 완료
		isLoading = false;

		// 에러가 있는 경우 토스트로 표시
		if (error) {
			toast.error(`OAuth2 인증 에러: ${error}`);
		} else if (authCode) {
			toast.success('인증 코드를 받았습니다. 토큰으로 교환해보세요!');
		} else if (implicitTokens) {
			toast.success('토큰을 성공적으로 받았습니다! (Implicit Grant)');
		}
	});

	// 토큰 교환 성공 핸들러
	function handleTokenExchanged(response: TokenResponse) {
		tokenResponse = response;
		showTokenModal = true;
		activeTab = 'token';
		toast.success('토큰 교환이 성공했습니다!');
	}

	function navigateBack() {
		window.location.href = '/dashboard/oauth-tester';
	}

	function goToDashboard() {
		window.location.href = '/dashboard';
	}

	// 토큰 정보 디코딩
	function decodeJWT(token: string): TokenInfo | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				throw new Error('Invalid JWT format');
			}

			const payload = JSON.parse(atob(parts[1]));
			const header = JSON.parse(atob(parts[0]));

			return {
				header,
				payload,
				signature: parts[2],
				issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
				expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
				isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false
			};
		} catch {
			return null;
		}
	}

	// 사용자 프로필 정보 가져오기
	async function fetchUserProfile() {
		// implicit grant와 authorization code grant 모두 지원
		const accessToken = tokenResponse?.access_token || implicitTokens?.access_token;

		if (!accessToken) {
			toast.error('유효한 액세스 토큰이 없습니다.');
			return;
		}

		isTestingToken = true;
		try {
			const apiUrl = createApiUrl('/oauth2/userinfo');

			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || `HTTP error! status: ${response.status}`);
			}

			userProfile = data;
			activeTab = 'profile';
			toast.success('사용자 프로필을 성공적으로 가져왔습니다!');
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : '프로필 정보를 가져오는데 실패했습니다.';
			toast.error(errorMessage);
		} finally {
			isTestingToken = false;
		}
	}

	// 토큰 정보 분석
	function analyzeToken() {
		// implicit grant와 authorization code grant 모두 지원
		const accessToken = tokenResponse?.access_token || implicitTokens?.access_token;

		if (!accessToken) {
			toast.error('유효한 액세스 토큰이 없습니다.');
			return;
		}

		tokenInfo = decodeJWT(accessToken);
		tokenAnalysisType = 'access';
		activeTab = 'test';

		if (tokenInfo) {
			toast.success('액세스 토큰 정보를 분석했습니다.');
		} else {
			toast.error('토큰을 분석할 수 없습니다.');
		}
	}

	// ID 토큰 정보 분석
	function analyzeIdToken() {
		// implicit grant와 authorization code grant 모두 지원
		const idToken = tokenResponse?.id_token || implicitTokens?.id_token;

		if (!idToken) {
			toast.error('유효한 ID 토큰이 없습니다.');
			return;
		}

		idTokenInfo = decodeJWT(idToken);
		tokenAnalysisType = 'id';
		activeTab = 'test';

		if (idTokenInfo) {
			toast.success('ID 토큰 정보를 분석했습니다.');
		} else {
			toast.error('ID 토큰을 분석할 수 없습니다.');
		}
	}

	// 클립보드 복사 유틸리티 함수
	function copyToClipboard(text: string) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				toast.success('클립보드에 복사되었습니다');
			})
			.catch(() => {
				toast.error('클립보드 복사에 실패했습니다');
			});
	}

	// JWT 토큰을 헤더, 페이로드, 서명으로 분리하여 표시하는 함수
	function formatJwtToken(token: string) {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return { isValid: false, header: '', payload: '', signature: '', fullToken: token };
		}
		return {
			isValid: true,
			header: parts[0],
			payload: parts[1],
			signature: parts[2],
			fullToken: token
		};
	}
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
		<CallbackHeader onNavigateBack={navigateBack} onGoToDashboard={goToDashboard} />

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 페이지 헤더 -->
				<div>
					<h2 class="text-2xl font-bold text-gray-900">OAuth2 인증 콜백</h2>
					<p class="mt-1 text-sm text-gray-600">인증 코드를 액세스 토큰으로 교환하세요.</p>
				</div>

				<!-- 인증 결과 표시 -->
				<AuthResultDisplay {error} {authCode} {implicitTokens} {responseType} {oauthState} />

				<!-- 토큰 교환 폼 (Authorization Code Grant에서만 표시) -->
				{#if authCode && !implicitTokens}
					<TokenExchangeForm
						clientId={tokenForm.clientId}
						clientSecret={tokenForm.clientSecret}
						code={tokenForm.code}
						redirectUri={tokenForm.redirectUri}
						codeVerifier={tokenForm.codeVerifier}
						{authCode}
						onTokenExchanged={handleTokenExchanged}
						onClientIdChange={(value) => {
							tokenForm.clientId = value;
						}}
						onClientSecretChange={(value) => {
							tokenForm.clientSecret = value;
						}}
						onCodeChange={(value) => {
							tokenForm.code = value;
						}}
						onRedirectUriChange={(value) => {
							tokenForm.redirectUri = value;
						}}
						onCodeVerifierChange={(value) => {
							tokenForm.codeVerifier = value;
						}}
					/>
				{/if}

				<!-- Implicit Grant 토큰 정보 -->
				{#if implicitTokens}
					<ImplicitTokenDisplay
						{implicitTokens}
						{isTestingToken}
						onShowTokenModal={() => (showTokenModal = true)}
						onFetchUserProfile={fetchUserProfile}
					/>
				{/if}

				<!-- 사용 안내 -->
				<UsageGuideSection {responseType} {implicitTokens} />
			</div>
		</main>
	</div>

	<!-- 토큰 응답 모달 -->
	<TokenModal
		{showTokenModal}
		{tokenResponse}
		{implicitTokens}
		{activeTab}
		{userProfile}
		{tokenInfo}
		{idTokenInfo}
		{tokenAnalysisType}
		{isTestingToken}
		onCloseModal={() => (showTokenModal = false)}
		onSetActiveTab={(tab) => (activeTab = tab)}
		onSetAnalysisType={(type) => (tokenAnalysisType = type)}
		onCopyToClipboard={copyToClipboard}
		onFetchUserProfile={fetchUserProfile}
		onAnalyzeToken={analyzeToken}
		onAnalyzeIdToken={analyzeIdToken}
		{formatJwtToken}
	/>
{/if}

<!-- 푸터 -->
<Footer />
