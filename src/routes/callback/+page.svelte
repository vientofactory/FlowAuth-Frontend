<script lang="ts">
	import { Card, Button, Input, Badge, Loading, Modal } from '$lib';
	import { createApiUrl } from '$lib/config/env';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';

	// URL 파라미터에서 코드와 상태 추출
	let authCode = $state('');
	let oauthState = $state('');
	let error = $state('');
	let isLoading = $state(true);

	// 토큰 교환 폼
	let tokenForm = $state({
		clientId: '',
		clientSecret: '',
		code: '',
		redirectUri: 'http://localhost:5173/callback',
		codeVerifier: '',
		grantType: 'authorization_code'
	});

	// 응답 데이터
	let tokenResponse: any = $state(null);
	let isExchanging = $state(false);
	let showTokenModal = $state(false);

	// 토큰 테스트 관련
	let isTestingToken = $state(false);
	let userProfile: any = $state(null);
	let tokenInfo: any = $state(null);
	let activeTab = $state('token'); // 'token', 'profile', 'test'

	const toast = useToast();

	onMount(() => {
		// URL 파라미터 파싱
		const urlParams = new URLSearchParams(window.location.search);
		authCode = urlParams.get('code') || '';
		oauthState = urlParams.get('state') || '';
		error = urlParams.get('error') || '';

		// 폼에 코드 설정
		if (authCode) {
			tokenForm.code = authCode;
		}

		// 로컬 스토리지에서 code_verifier 가져오기
		const storedCodeVerifier = localStorage.getItem('code_verifier');
		if (storedCodeVerifier) {
			tokenForm.codeVerifier = storedCodeVerifier;
		}

		isLoading = false;

		// 에러가 있는 경우 토스트로 표시
		if (error) {
			toast.error(`OAuth2 인증 에러: ${error}`);
		} else if (authCode) {
			toast.success('인증 코드를 받았습니다. 토큰으로 교환해보세요!');
		}
	});

	async function exchangeCodeForToken() {
		if (!tokenForm.clientId.trim()) {
			toast.error('클라이언트 ID를 입력해주세요.');
			return;
		}

		if (!tokenForm.clientSecret.trim()) {
			toast.error('클라이언트 시크릿을 입력해주세요.');
			return;
		}

		if (!tokenForm.code.trim()) {
			toast.error('인증 코드를 입력해주세요.');
			return;
		}

		isExchanging = true;
		try {
			const requestBody: any = {
				grant_type: tokenForm.grantType,
				client_id: tokenForm.clientId.trim(),
				client_secret: tokenForm.clientSecret.trim(),
				code: tokenForm.code.trim(),
				redirect_uri: tokenForm.redirectUri.trim(),
			};

			// PKCE 사용 시 code_verifier 추가
			if (tokenForm.codeVerifier.trim()) {
				requestBody.code_verifier = tokenForm.codeVerifier.trim();
			}

			const response = await fetch(createApiUrl('/oauth2/token'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || `HTTP error! status: ${response.status}`);
			}

			tokenResponse = data;
			showTokenModal = true;
			activeTab = 'token'; // 기본 탭 설정
			toast.success('토큰 교환이 성공했습니다!');

			// code_verifier 정리
			localStorage.removeItem('code_verifier');
		} catch (err: any) {
			toast.error(err.message || '토큰 교환에 실패했습니다.');
		} finally {
			isExchanging = false;
		}
	}

	// 클립보드에 복사
	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success('클립보드에 복사되었습니다!');
		} catch (err) {
			toast.error('클립보드 복사에 실패했습니다.');
		}
	}

	function navigateBack() {
		window.location.href = '/dashboard/oauth-tester';
	}

	function goToDashboard() {
		window.location.href = '/dashboard';
	}

	// 토큰 정보 디코딩
	function decodeJWT(token: string) {
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
		} catch (error) {
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
			const response = await fetch(createApiUrl('/oauth2/userinfo'), {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${tokenResponse.access_token}`,
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
		} catch (err: any) {
			toast.error(err.message || '프로필 정보를 가져오는데 실패했습니다.');
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
		activeTab = 'test';
		
		if (tokenInfo) {
			toast.success('토큰 정보를 분석했습니다.');
		} else {
			toast.error('토큰을 분석할 수 없습니다.');
		}
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
					<p class="mt-1 text-sm text-gray-600">
						인증 코드를 액세스 토큰으로 교환하세요.
					</p>
				</div>

				<!-- 인증 결과 표시 -->
				<Card class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">인증 결과</h3>
					
					{#if error}
						<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<div class="flex items-center">
								<i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
								<span class="text-red-800 font-medium">인증 에러</span>
							</div>
							<p class="mt-1 text-red-700">{error}</p>
						</div>
					{:else if authCode}
						<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
							<div class="flex items-center">
								<i class="fas fa-check-circle text-green-600 mr-2"></i>
								<span class="text-green-800 font-medium">인증 성공</span>
							</div>
							<p class="mt-1 text-green-700">인증 코드를 성공적으로 받았습니다.</p>
						</div>
					{:else}
						<div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<div class="flex items-center">
								<i class="fas fa-info-circle text-yellow-600 mr-2"></i>
								<span class="text-yellow-800 font-medium">정보</span>
							</div>
							<p class="mt-1 text-yellow-700">인증 코드가 없습니다. OAuth2 테스터에서 인증을 시작하세요.</p>
						</div>
					{/if}

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#if authCode}
							<div>
								<div class="text-sm font-medium text-gray-700 mb-1">인증 코드</div>
								<div class="p-2 bg-gray-50 border border-gray-200 rounded text-xs font-mono break-all">
									{authCode}
								</div>
							</div>
						{/if}

						{#if oauthState}
							<div>
								<div class="text-sm font-medium text-gray-700 mb-1">State</div>
								<div class="p-2 bg-gray-50 border border-gray-200 rounded text-xs font-mono break-all">
									{oauthState}
								</div>
							</div>
						{/if}
					</div>
				</Card>

				<!-- 토큰 교환 폼 -->
				{#if authCode && !error}
					<Card class="p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">토큰 교환</h3>
						
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<!-- 클라이언트 ID -->
							<div>
								<label for="clientId" class="block text-sm font-medium text-gray-700 mb-2">
									클라이언트 ID *
								</label>
								<Input
									id="clientId"
									value={tokenForm.clientId}
									oninput={(e) => tokenForm.clientId = (e.target as HTMLInputElement)?.value || ''}
									placeholder="클라이언트 ID를 입력하세요"
									class="w-full"
									required
								/>
							</div>

							<!-- 클라이언트 시크릿 -->
							<div>
								<label for="clientSecret" class="block text-sm font-medium text-gray-700 mb-2">
									클라이언트 시크릿 *
								</label>
								<Input
									id="clientSecret"
									type="password"
									value={tokenForm.clientSecret}
									oninput={(e) => tokenForm.clientSecret = (e.target as HTMLInputElement)?.value || ''}
									placeholder="클라이언트 시크릿을 입력하세요"
									class="w-full"
									required
								/>
							</div>

							<!-- 인증 코드 -->
							<div>
								<label for="code" class="block text-sm font-medium text-gray-700 mb-2">
									인증 코드 *
								</label>
								<Input
									id="code"
									value={tokenForm.code}
									oninput={(e) => tokenForm.code = (e.target as HTMLInputElement)?.value || ''}
									placeholder="인증 코드"
									class="w-full"
									disabled
								/>
							</div>

							<!-- 리다이렉트 URI -->
							<div>
								<label for="redirectUri" class="block text-sm font-medium text-gray-700 mb-2">
									리다이렉트 URI *
								</label>
								<Input
									id="redirectUri"
									value={tokenForm.redirectUri}
									oninput={(e) => tokenForm.redirectUri = (e.target as HTMLInputElement)?.value || ''}
									placeholder="리다이렉트 URI"
									class="w-full"
									required
								/>
							</div>

							<!-- Grant Type -->
							<div>
								<label for="grantType" class="block text-sm font-medium text-gray-700 mb-2">
									Grant Type
								</label>
								<select
									id="grantType"
									bind:value={tokenForm.grantType}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								>
									<option value="authorization_code">Authorization Code</option>
								</select>
							</div>

							<!-- Code Verifier (PKCE) -->
							<div>
								<label for="codeVerifier" class="block text-sm font-medium text-gray-700 mb-2">
									Code Verifier (PKCE)
								</label>
								<Input
									id="codeVerifier"
									value={tokenForm.codeVerifier}
									oninput={(e) => tokenForm.codeVerifier = (e.target as HTMLInputElement)?.value || ''}
									placeholder="PKCE Code Verifier"
									class="w-full"
									disabled
								/>
								{#if tokenForm.codeVerifier}
									<p class="mt-1 text-xs text-green-600">
										<i class="fas fa-check mr-1"></i>
										로컬 스토리지에서 자동으로 불러왔습니다.
									</p>
								{:else}
									<p class="mt-1 text-xs text-gray-500">
										PKCE를 사용한 경우에만 필요합니다.
									</p>
								{/if}
							</div>
						</div>

						<!-- 교환 버튼 -->
						<div class="mt-6 flex justify-end">
							<Button
								onclick={exchangeCodeForToken}
								disabled={isExchanging}
								class="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
							>
								{#if isExchanging}
									<Loading variant="spinner" size="sm" class="mr-2" />
									교환 중...
								{:else}
									<i class="fas fa-exchange-alt mr-2"></i>
									토큰으로 교환
								{/if}
							</Button>
						</div>
					</Card>
				{/if}

				<!-- 사용 안내 -->
				<Card class="p-6">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">사용 안내</h3>
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
		{#snippet children()}
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
							class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
								{activeTab === 'token' 
									? 'border-blue-500 text-blue-600' 
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							토큰 정보
						</button>
						<button
							onclick={() => (activeTab = 'profile')}
							class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
								{activeTab === 'profile' 
									? 'border-blue-500 text-blue-600' 
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
						>
							프로필 정보
						</button>
						<button
							onclick={() => (activeTab = 'test')}
							class="py-2 px-1 border-b-2 font-medium text-sm transition-colors
								{activeTab === 'test' 
									? 'border-blue-500 text-blue-600' 
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
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
										onclick={() => copyToClipboard(tokenResponse.access_token)}
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
										onclick={() => copyToClipboard(tokenResponse.refresh_token)}
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
						<div class="flex space-x-2 pt-4 border-t border-gray-200">
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
								토큰 분석
							</Button>
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
							<div class="text-center py-8">
								<i class="fas fa-user-circle text-4xl text-gray-400 mb-4"></i>
								<p class="text-gray-500 mb-4">프로필 정보를 가져오려면 "프로필 가져오기" 버튼을 클릭하세요.</p>
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
						{#if tokenInfo}
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
										<div class="mb-1 text-sm font-medium text-gray-700">알고리즘</div>
										<div class="text-sm text-gray-900">{tokenInfo.header.alg}</div>
									</div>
								</div>

								<!-- 시간 정보 -->
								{#if tokenInfo.issuedAt || tokenInfo.expiresAt}
									<div class="grid grid-cols-1 gap-4">
										{#if tokenInfo.issuedAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">발급 시간</div>
												<div class="text-sm text-gray-900">{tokenInfo.issuedAt.toLocaleString()}</div>
											</div>
										{/if}
										{#if tokenInfo.expiresAt}
											<div>
												<div class="mb-1 text-sm font-medium text-gray-700">만료 시간</div>
												<div class="text-sm text-gray-900">{tokenInfo.expiresAt.toLocaleString()}</div>
											</div>
										{/if}
									</div>
								{/if}

								<!-- 페이로드 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">페이로드</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(tokenInfo.payload, null, 2)}</pre>
									</div>
								</div>

								<!-- 헤더 정보 -->
								<div>
									<div class="mb-2 text-sm font-medium text-gray-700">헤더</div>
									<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
										<pre class="text-xs text-gray-800">{JSON.stringify(tokenInfo.header, null, 2)}</pre>
									</div>
								</div>
							</div>
						{:else}
							<div class="text-center py-8">
								<i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
								<p class="text-gray-500 mb-4">토큰을 분석하려면 "토큰 분석" 버튼을 클릭하세요.</p>
								<Button onclick={analyzeToken}>
									<i class="fas fa-search mr-2"></i>
									토큰 분석
								</Button>
							</div>
						{/if}
					</div>
				{/if}

				<!-- 하단 안내 -->
				<div class="text-xs text-gray-500 border-t border-gray-200 pt-4">
					<p><strong>참고:</strong> 이 토큰들은 API 요청에 사용할 수 있습니다.</p>
					<p>액세스 토큰은 Authorization 헤더에 "Bearer &lt;token&gt;" 형식으로 포함시키세요.</p>
				</div>
				</div>
			{/if}
		{/snippet}
	</Modal>
{/if}