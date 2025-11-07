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
	import { useToast } from '$lib';
	import { apiClient } from '$lib/utils/api';
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

	// 유틸리티 함수들 - 데이터 수집 및 복원
	interface OAuthParams {
		authCode: string;
		oauthState: string;
		error: string;
		implicitTokens: TokenResponse | null;
		responseType: string;
	}

	interface StoredOAuthData {
		clientId: string;
		clientSecret: string;
		codeVerifier: string;
		redirectUri: string;
		nonce: string;
	}

	// URL에서 OAuth 파라미터 추출
	function extractOAuthParams(): OAuthParams {
		// URL 파라미터 파싱 (Authorization Code Grant)
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code') || '';
		const state = urlParams.get('state') || '';
		const urlError = urlParams.get('error') || '';

		// URL Fragment 파싱 (Implicit Grant)
		const hash = window.location.hash.substring(1);
		const fragmentParams = new URLSearchParams(hash);

		// Fragment에서 토큰 추출
		const accessToken = fragmentParams.get('access_token');
		const idToken = fragmentParams.get('id_token');
		const tokenType = fragmentParams.get('token_type');
		const expiresIn = fragmentParams.get('expires_in');
		const scope = fragmentParams.get('scope');
		const fragmentState = fragmentParams.get('state');
		const fragmentError = fragmentParams.get('error');

		// 최종 error 결정
		const finalError = urlError || fragmentError;

		// 최종 state 결정 (fragment에서 온 state가 우선)
		const finalState = fragmentState || state;

		// Response type 결정
		let detectedResponseType = '';
		if (code && idToken) {
			detectedResponseType = 'code id_token'; // Hybrid Grant
		} else if (code) {
			detectedResponseType = 'code';
		} else if (accessToken && idToken) {
			detectedResponseType = 'token id_token';
		} else if (accessToken) {
			detectedResponseType = 'token';
		} else if (idToken) {
			detectedResponseType = 'id_token';
		}

		// Implicit Grant 토큰 객체 생성
		let tokens: TokenResponse | null = null;
		if (accessToken || idToken) {
			tokens = {
				access_token: accessToken || '',
				token_type: tokenType || 'Bearer',
				expires_in: expiresIn ? parseInt(expiresIn) : undefined,
				scope: scope || undefined,
				id_token: idToken || undefined
			};
		}

		return {
			authCode: code,
			oauthState: finalState,
			error: finalError || '',
			implicitTokens: tokens,
			responseType: detectedResponseType
		};
	}

	// 세션 스토리지에서 OAuth 데이터 복원
	function restoreFromSessionStorage(): Partial<StoredOAuthData> {
		return {
			clientId: sessionStorage.getItem('client_id') || '',
			clientSecret: sessionStorage.getItem('client_secret') || '',
			codeVerifier: sessionStorage.getItem('code_verifier') || '',
			redirectUri: sessionStorage.getItem('redirect_uri') || '',
			nonce: sessionStorage.getItem('oauth_nonce') || ''
		};
	}

	// localStorage 백업 데이터 복원
	function restoreFromBackupStorage(oauthState: string): Partial<StoredOAuthData> | null {
		try {
			const backupDataStr = localStorage.getItem('oauth_backup_data');
			if (!backupDataStr) return null;

			const parsed = JSON.parse(backupDataStr);

			// 5분 이내의 데이터만 사용
			if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
				localStorage.removeItem('oauth_backup_data');
				return null;
			}

			// state가 일치하는지 확인 (state가 없는 경우는 허용)
			if (oauthState && parsed.state !== oauthState) {
				return null;
			}

			return {
				clientId: parsed.client_id || '',
				clientSecret: parsed.client_secret || '',
				codeVerifier: parsed.code_verifier || '',
				redirectUri: parsed.redirect_uri || '',
				nonce: parsed.oauth_nonce || ''
			};
		} catch {
			localStorage.removeItem('oauth_backup_data');
			return null;
		}
	}

	// redirect_uri 결정 로직
	function determineRedirectUri(
		sessionData: Partial<StoredOAuthData>,
		backupData: Partial<StoredOAuthData> | null
	): string {
		// 1차: 세션 스토리지
		if (sessionData.redirectUri) {
			return sessionData.redirectUri;
		}

		// 2차: localStorage 백업
		if (backupData?.redirectUri) {
			return backupData.redirectUri;
		}

		// 3차: 현재 URL 기반 추론
		const currentUrl = new URL(window.location.href);
		return `${currentUrl.protocol}//${currentUrl.host}${currentUrl.pathname}`;
	}

	// 저장된 OAuth 데이터 통합
	function mergeStoredData(
		sessionData: Partial<StoredOAuthData>,
		backupData: Partial<StoredOAuthData> | null
	): StoredOAuthData {
		return {
			clientId: sessionData.clientId || backupData?.clientId || '',
			clientSecret: sessionData.clientSecret || backupData?.clientSecret || '',
			codeVerifier: sessionData.codeVerifier || backupData?.codeVerifier || '',
			redirectUri: determineRedirectUri(sessionData, backupData),
			nonce: sessionData.nonce || backupData?.nonce || ''
		};
	}

	// localStorage 백업 데이터 정리
	function cleanupBackupData(): void {
		try {
			localStorage.removeItem('oauth_backup_data');
		} catch {
			// 무시
		}
	}

	onMount(() => {
		// 브라우저 환경 확인
		if (typeof window === 'undefined') {
			isLoading = false;
			return;
		}

		// URL에서 OAuth 파라미터 추출
		const oauthParams = extractOAuthParams();
		authCode = oauthParams.authCode;
		oauthState = oauthParams.oauthState;
		error = oauthParams.error;
		implicitTokens = oauthParams.implicitTokens;
		responseType = oauthParams.responseType;

		// Implicit Grant 또는 Hybrid Grant 성공 처리
		if (implicitTokens) {
			tokenResponse = implicitTokens;
			showTokenModal = true;
			activeTab = 'token';
		}

		// Hybrid Grant의 경우 ID 토큰을 먼저 표시하되, code 교환은 별도로 처리
		if (responseType === 'code id_token' && implicitTokens?.id_token) {
			showTokenModal = true;
			activeTab = 'token';
		}

		// 저장된 OAuth 데이터 복원
		const sessionData = restoreFromSessionStorage();
		const backupData = restoreFromBackupStorage(oauthState);
		const mergedData = mergeStoredData(sessionData, backupData);

		// nonce 값 복원 (세션 스토리지에 설정)
		if (mergedData.nonce) {
			sessionStorage.setItem('oauth_nonce', mergedData.nonce);
			_oauthNonce = mergedData.nonce;
		}

		// 토큰 폼 초기화
		tokenForm = {
			clientId: mergedData.clientId,
			clientSecret: mergedData.clientSecret,
			code: authCode,
			redirectUri: mergedData.redirectUri,
			codeVerifier: mergedData.codeVerifier,
			grantType: 'authorization_code' as const
		};

		// 로딩 타임아웃 설정
		_loadingTimeout = setTimeout(() => {
			if (isLoading) {
				isLoading = false;
				toast.error('콜백 처리 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
			}
		}, 3000);

		// 로딩 완료
		isLoading = false;

		// 상태에 따른 토스트 메시지
		if (error) {
			toast.error(`OAuth2 인증 에러: ${error}`);
		} else if (responseType === 'code id_token') {
			toast.success('하이브리드 인증이 성공했습니다! ID 토큰을 확인하고 코드를 교환해보세요.');
		} else if (authCode) {
			toast.success('인증 코드를 받았습니다. 토큰으로 교환해보세요!');
		} else if (implicitTokens) {
			toast.success('토큰을 성공적으로 받았습니다! (Implicit Grant)');
			cleanupBackupData();
		}
	});

	// 토큰 교환 성공 핸들러
	function handleTokenExchanged(response: TokenResponse) {
		// Hybrid Grant의 경우 기존 ID 토큰을 유지
		if (responseType === 'code id_token' && implicitTokens?.id_token) {
			tokenResponse = {
				...response,
				id_token: implicitTokens.id_token
			};
		} else {
			tokenResponse = response;
		}

		showTokenModal = true;
		activeTab = 'token';
		toast.success('토큰 교환이 성공했습니다!');

		// 성공적으로 토큰을 받았으므로 백업 데이터 정리
		cleanupBackupData();
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
			const data = await apiClient.oauth.getUserInfo(accessToken);

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
	<div class="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
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

				<!-- 토큰 교환 폼 (Authorization Code Grant 또는 Hybrid Grant에서 표시) -->
				{#if authCode && (responseType === 'code' || responseType === 'code id_token')}
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

				<!-- Implicit Grant 토큰 정보 (Hybrid Grant 제외) -->
				{#if implicitTokens && responseType !== 'code id_token'}
					<ImplicitTokenDisplay
						{implicitTokens}
						{isTestingToken}
						onShowTokenModal={() => (showTokenModal = true)}
						onFetchUserProfile={fetchUserProfile}
					/>
				{/if}

				<!-- 사용 안내 -->
				<UsageGuideSection {responseType} {implicitTokens} {authCode} />
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
