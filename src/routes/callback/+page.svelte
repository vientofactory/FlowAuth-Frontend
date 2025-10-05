<script lang="ts">
	import { Card, Button, Badge, Loading, Modal } from '$lib';
	import Footer from '$lib/components/Footer.svelte';
	import { createApiUrl } from '$lib/config/env';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import TokenExchangeForm from '$lib/components/oauth/TokenExchangeForm.svelte';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	// URL 파라미터에서 코드와 상태 추출
	let authCode = $state('');
	let oauthState = $state('');
	let _oauthNonce = $state('');
	let error = $state('');
	let isLoading = $state(true);

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

		// URL 파라미터 파싱
		const urlParams = new URLSearchParams(window.location.search);
		authCode = urlParams.get('code') || '';
		oauthState = urlParams.get('state') || '';
		error = urlParams.get('error') || '';

		// 토큰 폼에 코드 설정
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
		if (!tokenResponse?.access_token) {
			toast.error('유효한 액세스 토큰이 없습니다.');
			return;
		}

		isTestingToken = true;
		try {
			const apiUrl = createApiUrl('/oauth2/userinfo');

			const response = await fetch(apiUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${tokenResponse.access_token}`,
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
		if (!tokenResponse?.access_token) {
			toast.error('유효한 액세스 토큰이 없습니다.');
			return;
		}

		tokenInfo = decodeJWT(tokenResponse.access_token);
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
		if (!tokenResponse?.id_token) {
			toast.error('유효한 ID 토큰이 없습니다.');
			return;
		}

		idTokenInfo = decodeJWT(tokenResponse.id_token);
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

				<!-- 인증 결과 표시 -->
				<Card class="p-6">
					<h3 class="mb-4 text-lg font-semibold text-gray-900">인증 결과</h3>

					{#if error}
						<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
							<div class="flex items-center">
								<i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>
								<span class="font-medium text-red-800">인증 에러</span>
							</div>
							<p class="mt-1 text-red-700">{error}</p>
						</div>
					{:else if authCode}
						<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
							<div class="flex items-center">
								<i class="fas fa-check-circle mr-2 text-green-600"></i>
								<span class="font-medium text-green-800">인증 성공</span>
							</div>
							<p class="mt-1 text-green-700">인증 코드를 성공적으로 받았습니다.</p>
						</div>
					{:else}
						<div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
							<div class="flex items-center">
								<i class="fas fa-info-circle mr-2 text-yellow-600"></i>
								<span class="font-medium text-yellow-800">정보</span>
							</div>
							<p class="mt-1 text-yellow-700">
								인증 코드가 없습니다. OAuth2 테스터에서 인증을 시작하세요.
							</p>
						</div>
					{/if}

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#if authCode}
							<div>
								<div class="mb-1 text-sm font-medium text-gray-700">인증 코드</div>
								<div
									class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all"
								>
									{authCode}
								</div>
							</div>
						{/if}

						{#if oauthState}
							<div>
								<div class="mb-1 text-sm font-medium text-gray-700">State</div>
								<div
									class="rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs break-all"
								>
									{oauthState}
								</div>
							</div>
						{/if}
					</div>
				</Card>

				<!-- 토큰 교환 폼 -->
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

				<!-- 사용 안내 -->
				<Card class="p-6">
					<h3 class="mb-4 text-lg font-semibold text-gray-900">사용 안내</h3>
					<div class="space-y-4 text-sm text-gray-600">
						<div>
							<h4 class="font-medium text-gray-900">1. 인증 코드 확인</h4>
							<p>OAuth2 인증 서버로부터 받은 인증 코드를 확인하세요.</p>
						</div>
						<div>
							<h4 class="font-medium text-gray-900">2. 클라이언트 정보 입력</h4>
							<p>토큰을 교환하기 위해 클라이언트 ID와 시크릿을 입력하세요.</p>
						</div>
						<div>
							<h4 class="font-medium text-gray-900">3. 토큰 교환</h4>
							<p>인증 코드를 액세스 토큰으로 교환하여 API에 접근할 수 있습니다.</p>
						</div>
					</div>
				</Card>
			</div>
		</main>
	</div>

	<!-- 토큰 응답 모달 -->
	<Modal
		open={showTokenModal && !!tokenResponse}
		title="OAuth2 토큰 테스트"
		onClose={() => (showTokenModal = false)}
		size="xl"
	>
		{#if tokenResponse}
			<div class="space-y-6">
				<!-- 성공 메시지 -->
				<div class="rounded-lg border border-green-200 bg-green-50 p-4">
					<div class="flex items-center">
						<i class="fas fa-check-circle mr-2 text-green-600"></i>
						<span class="font-medium text-green-800">토큰 교환 성공</span>
					</div>
				</div>

				<!-- 탭 메뉴 -->
				<div class="border-b border-gray-200">
					<nav class="-mb-px flex space-x-8">
						<button
							onclick={() => (activeTab = 'token')}
							class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'token'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							토큰 정보
						</button>
						<button
							onclick={() => (activeTab = 'profile')}
							class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'profile'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							프로필 정보
						</button>
						<button
							onclick={() => (activeTab = 'test')}
							class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'test'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							토큰 분석
						</button>
					</nav>
				</div>
				<!-- 탭 콘텐츠 -->
				{#if activeTab === 'token'}
					<div class="space-y-4">
						{#if tokenResponse.access_token}
							<div>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Access Token</span>
									<Button
										variant="outline"
										size="sm"
										onclick={() => tokenResponse && copyToClipboard(tokenResponse.access_token)}
										class="text-xs"
									>
										<i class="fas fa-copy mr-1"></i>
										복사
									</Button>
								</div>
								<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
									<code class="text-xs break-all text-gray-800">{tokenResponse.access_token}</code>
								</div>
							</div>
						{/if}

						{#if tokenResponse.refresh_token}
							<div>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Refresh Token</span>
									<Button
										variant="outline"
										size="sm"
										onclick={() =>
											tokenResponse?.refresh_token && copyToClipboard(tokenResponse.refresh_token)}
										class="text-xs"
									>
										<i class="fas fa-copy mr-1"></i>
										복사
									</Button>
								</div>
								<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
									<code class="text-xs break-all text-gray-800">{tokenResponse.refresh_token}</code>
								</div>
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-4">
							{#if tokenResponse.token_type}
								<div>
									<div class="mb-1 text-sm font-medium text-gray-700">Token Type</div>
									<div class="text-sm text-gray-900">{tokenResponse.token_type}</div>
								</div>
							{/if}

							{#if tokenResponse.expires_in}
								<div>
									<div class="mb-1 text-sm font-medium text-gray-700">Expires In</div>
									<div class="text-sm text-gray-900">{tokenResponse.expires_in}초</div>
								</div>
							{/if}

							{#if tokenResponse.scope}
								<div class="col-span-2">
									<div class="mb-1 text-sm font-medium text-gray-700">Scope</div>
									<div class="text-sm text-gray-900">{tokenResponse.scope}</div>
								</div>
							{/if}
						</div>

						<!-- 액션 버튼들 -->
						<div class="flex flex-wrap gap-2 border-t border-gray-200 pt-4">
							<Button onclick={fetchUserProfile} disabled={isTestingToken} size="sm">
								{#if isTestingToken}
									<Loading variant="spinner" size="sm" class="mr-2" />
									프로필 가져오는 중...
								{:else}
									<i class="fas fa-user mr-2"></i>
									프로필 가져오기
								{/if}
							</Button>
							<Button variant="outline" onclick={analyzeToken} size="sm">
								<i class="fas fa-search mr-2"></i>
								액세스 토큰 분석
							</Button>
							{#if tokenResponse?.id_token}
								<Button variant="outline" onclick={analyzeIdToken} size="sm">
									<i class="fas fa-id-card mr-2"></i>
									ID 토큰 분석
								</Button>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'profile'}
					<div class="space-y-4">
						{#if userProfile}
							<div class="space-y-3">
								<div class="grid grid-cols-2 gap-4">
									{#if userProfile.sub}
										<div>
											<div class="mb-1 text-sm font-medium text-gray-700">User ID</div>
											<div class="text-sm text-gray-900">{userProfile.sub}</div>
										</div>
									{/if}
									{#if userProfile.email}
										<div>
											<div class="mb-1 text-sm font-medium text-gray-700">Email</div>
											<div class="text-sm text-gray-900">{userProfile.email}</div>
										</div>
									{/if}
									{#if userProfile.username}
										<div>
											<div class="mb-1 text-sm font-medium text-gray-700">Username</div>
											<div class="text-sm text-gray-900">{userProfile.username}</div>
										</div>
									{/if}
									{#if userProfile.roles && userProfile.roles.length > 0}
										<div>
											<div class="mb-1 text-sm font-medium text-gray-700">Roles</div>
											<div class="text-sm text-gray-900">{userProfile.roles.join(', ')}</div>
										</div>
									{/if}
								</div>

								<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
									<div class="mb-1 text-sm font-medium text-gray-700">전체 응답</div>
									<pre class="text-xs text-gray-800">{JSON.stringify(userProfile, null, 2)}</pre>
								</div>
							</div>
						{:else}
							<div class="py-8 text-center">
								<i class="fas fa-user-circle mb-4 text-4xl text-gray-400"></i>
								<p class="mb-4 text-gray-500">
									프로필 정보를 가져오려면 "프로필 가져오기" 버튼을 클릭하세요.
								</p>
								<Button onclick={fetchUserProfile} disabled={isTestingToken}>
									{#if isTestingToken}
										<Loading variant="spinner" size="sm" class="mr-2" />
										프로필 가져오는 중...
									{:else}
										<i class="fas fa-user mr-2"></i>
										프로필 가져오기
									{/if}
								</Button>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'test'}
					<div class="space-y-4">
						<!-- 토큰 타입 선택 -->
						<div class="flex space-x-2 border-b border-gray-200 pb-4">
							<Button
								variant={tokenAnalysisType === 'access' ? 'primary' : 'outline'}
								size="sm"
								onclick={() => {
									tokenAnalysisType = 'access';
									if (tokenResponse?.access_token && !tokenInfo) {
										analyzeToken();
									}
								}}
								disabled={!tokenResponse?.access_token}
							>
								액세스 토큰
							</Button>
							<Button
								variant={tokenAnalysisType === 'id' ? 'primary' : 'outline'}
								size="sm"
								onclick={() => {
									tokenAnalysisType = 'id';
									if (tokenResponse?.id_token && !idTokenInfo) {
										analyzeIdToken();
									}
								}}
								disabled={!tokenResponse?.id_token}
							>
								ID 토큰
							</Button>
						</div>

						<!-- 선택된 토큰 분석 결과 -->
						{#if tokenAnalysisType === 'access' && tokenInfo}
							<div class="space-y-4">
								<!-- 토큰 상태 -->
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">상태</div>
										<div class="text-sm">
											{#if tokenInfo.isExpired}
												<Badge variant="error">만료됨</Badge>
											{:else}
												<Badge variant="success">유효함</Badge>
											{/if}
										</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">토큰 타입</div>
										<div class="text-sm text-gray-900">{tokenInfo.header.typ}</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">알고리즘</div>
										<div class="text-sm text-gray-900">{tokenInfo.header.alg}</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">제목</div>
										<div class="text-sm text-gray-900">액세스 토큰</div>
									</div>
								</div>

								<!-- 시간 정보 -->
								{#if tokenInfo.issuedAt || tokenInfo.expiresAt}
									<div class="grid grid-cols-1 gap-4">
										{#if tokenInfo.issuedAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">발급 시간</div>
												<div class="text-sm text-gray-900">
													{tokenInfo.issuedAt.toLocaleString()}
												</div>
											</div>
										{/if}
										{#if tokenInfo.expiresAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">만료 시간</div>
												<div class="text-sm text-gray-900">
													{tokenInfo.expiresAt.toLocaleString()}
												</div>
											</div>
										{/if}
									</div>
								{/if}

								<!-- 페이로드 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">페이로드</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(
												tokenInfo.payload,
												null,
												2
											)}</pre>
									</div>
								</div>

								<!-- 헤더 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">헤더</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(
												tokenInfo.header,
												null,
												2
											)}</pre>
									</div>
								</div>
							</div>
						{:else if tokenAnalysisType === 'id' && idTokenInfo}
							<div class="space-y-4">
								<!-- 토큰 상태 -->
								<div class="grid grid-cols-2 gap-4">
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">상태</div>
										<div class="text-sm">
											{#if idTokenInfo.isExpired}
												<Badge variant="error">만료됨</Badge>
											{:else}
												<Badge variant="success">유효함</Badge>
											{/if}
										</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">토큰 타입</div>
										<div class="text-sm text-gray-900">{idTokenInfo.header.typ}</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">알고리즘</div>
										<div class="text-sm text-gray-900">{idTokenInfo.header.alg}</div>
									</div>
									<div>
										<div class="mb-1 text-sm font-medium text-gray-700">제목</div>
										<div class="text-sm text-gray-900">ID 토큰</div>
									</div>
								</div>

								<!-- 시간 정보 -->
								{#if idTokenInfo.issuedAt || idTokenInfo.expiresAt}
									<div class="grid grid-cols-1 gap-4">
										{#if idTokenInfo.issuedAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">발급 시간</div>
												<div class="text-sm text-gray-900">
													{idTokenInfo.issuedAt.toLocaleString()}
												</div>
											</div>
										{/if}
										{#if idTokenInfo.expiresAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">만료 시간</div>
												<div class="text-sm text-gray-900">
													{idTokenInfo.expiresAt.toLocaleString()}
												</div>
											</div>
										{/if}
									</div>
								{/if}

								<!-- 페이로드 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">페이로드</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(
												idTokenInfo.payload,
												null,
												2
											)}</pre>
									</div>
								</div>

								<!-- 헤더 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">헤더</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(
												idTokenInfo.header,
												null,
												2
											)}</pre>
									</div>
								</div>
							</div>
						{:else}
							<div class="py-8 text-center">
								<i class="fas fa-search mb-4 text-4xl text-gray-400"></i>
								<p class="mb-4 text-gray-500">
									{tokenAnalysisType === 'access' ? '액세스 토큰' : 'ID 토큰'}을 분석하려면 위의
									버튼을 클릭하세요.
								</p>
								<Button onclick={tokenAnalysisType === 'access' ? analyzeToken : analyzeIdToken}>
									<i class="fas fa-search mr-2"></i>
									{tokenAnalysisType === 'access' ? '액세스 토큰' : 'ID 토큰'} 분석
								</Button>
							</div>
						{/if}
					</div>
				{/if}

				<!-- 하단 안내 -->
				<div class="border-t border-gray-200 pt-4 text-xs text-gray-500">
					<p><strong>참고:</strong> 이 토큰들은 API 요청에 사용할 수 있습니다.</p>
					<p>액세스 토큰은 Authorization 헤더에 "Bearer &lt;token&gt;" 형식으로 포함시키세요.</p>
				</div>
			</div>
		{/if}
	</Modal>
{/if}

<!-- 푸터 -->
<Footer />
