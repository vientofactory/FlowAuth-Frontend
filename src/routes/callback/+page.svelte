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

			const response = await fetch(createApiUrl('/oauth/token'), {
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
			toast.success('토큰 교환이 성공했습니다!');

			// code_verifier 정리
			localStorage.removeItem('code_verifier');
		} catch (err: any) {
			console.error('Token exchange failed:', err);
			toast.error(err.message || '토큰 교환에 실패했습니다.');
		} finally {
			isExchanging = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			toast.success('클립보드에 복사되었습니다.');
		}).catch(() => {
			toast.error('복사에 실패했습니다.');
		});
	}

	function navigateBack() {
		window.location.href = '/dashboard/oauth-tester';
	}

	function goToDashboard() {
		window.location.href = '/dashboard';
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
									oninput={(e) => tokenForm.clientId = e.target.value}
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
									oninput={(e) => tokenForm.clientSecret = e.target.value}
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
									oninput={(e) => tokenForm.code = e.target.value}
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
									oninput={(e) => tokenForm.redirectUri = e.target.value}
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
									oninput={(e) => tokenForm.codeVerifier = e.target.value}
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
	{#if showTokenModal && tokenResponse}
		<Modal
			title="토큰 교환 결과"
			onClose={() => showTokenModal = false}
		>
			<div class="space-y-4">
				<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
					<div class="flex items-center">
						<i class="fas fa-check-circle text-green-600 mr-2"></i>
						<span class="text-green-800 font-medium">토큰 교환 성공</span>
					</div>
				</div>

				{#if tokenResponse.access_token}
					<div>
						<div class="text-sm font-medium text-gray-700 mb-2">
							Access Token
							<Button
								variant="outline"
								size="sm"
								onclick={() => copyToClipboard(tokenResponse.access_token)}
								class="ml-2 text-xs"
							>
								<i class="fas fa-copy mr-1"></i>
								복사
							</Button>
						</div>
						<div class="p-3 bg-gray-50 border border-gray-200 rounded-md">
							<code class="text-xs text-gray-800 break-all">{tokenResponse.access_token}</code>
						</div>
					</div>
				{/if}

				{#if tokenResponse.refresh_token}
					<div>
						<div class="text-sm font-medium text-gray-700 mb-2">
							Refresh Token
							<Button
								variant="outline"
								size="sm"
								onclick={() => copyToClipboard(tokenResponse.refresh_token)}
								class="ml-2 text-xs"
							>
								<i class="fas fa-copy mr-1"></i>
								복사
							</Button>
						</div>
						<div class="p-3 bg-gray-50 border border-gray-200 rounded-md">
							<code class="text-xs text-gray-800 break-all">{tokenResponse.refresh_token}</code>
						</div>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					{#if tokenResponse.token_type}
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Token Type</div>
							<div class="text-sm text-gray-900">{tokenResponse.token_type}</div>
						</div>
					{/if}

					{#if tokenResponse.expires_in}
						<div>
							<div class="text-sm font-medium text-gray-700 mb-1">Expires In</div>
							<div class="text-sm text-gray-900">{tokenResponse.expires_in}초</div>
						</div>
					{/if}

					{#if tokenResponse.scope}
						<div class="col-span-2">
							<div class="text-sm font-medium text-gray-700 mb-1">Scope</div>
							<div class="text-sm text-gray-900">{tokenResponse.scope}</div>
						</div>
					{/if}
				</div>

				<div class="text-xs text-gray-500">
					<p><strong>참고:</strong> 이 토큰들은 API 요청에 사용할 수 있습니다.</p>
					<p>액세스 토큰은 Authorization 헤더에 "Bearer &lt;token&gt;" 형식으로 포함시키세요.</p>
				</div>
			</div>
		</Modal>
	{/if}
{/if}