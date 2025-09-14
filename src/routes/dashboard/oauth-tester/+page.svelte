<script lang="ts">
	import { DashboardLayout, Card, Button, Badge } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';
	import { createApiUrl } from '$lib/config/env';
	import { CryptoUtils } from '$lib/utils/crypto.util';

	// 상태 변수들
	interface OAuthClient {
		id: string;
		name: string;
		clientId: string;
		redirectUris: string[];
		scopes: string[];
	}

	let clients = $state<OAuthClient[]>([
		{
			id: '1',
			name: 'My Web App',
			clientId: 'web_app_12345',
			redirectUris: ['https://myapp.com/callback'],
			scopes: ['openid', 'profile', 'email']
		},
		{
			id: '2',
			name: 'Mobile App',
			clientId: 'mobile_app_67890',
			redirectUris: ['myapp://callback'],
			scopes: ['openid', 'profile']
		}
	]);

	let selectedClient = $state<OAuthClient | null>(null);
	let scopes = $state('openid profile email');
	let responseType = $state('code');
	let usePKCE = $state(true);
	let generatedUrl = $state('');
	let showResult = $state(false);

	const toast = useToast();

	// OAuth 테스트 실행
	async function generateAuthorizationUrl() {
		if (!selectedClient) {
			toast.error('클라이언트를 선택해주세요.');
			return;
		}

		try {
			const baseUrl = createApiUrl('/oauth/authorize');
			const redirectUri = selectedClient.redirectUris[0];
			const state = CryptoUtils.generateRandomString(32);
			
			const params = new URLSearchParams({
				response_type: responseType,
				client_id: selectedClient.clientId,
				redirect_uri: redirectUri,
				scope: scopes,
				state
			});

			if (usePKCE && responseType === 'code') {
				const codeVerifier = CryptoUtils.generateCodeVerifier();
				const codeChallenge = await CryptoUtils.generateCodeChallenge(codeVerifier);
				params.append('code_challenge', codeChallenge);
				params.append('code_challenge_method', 'S256');
				
				// 코드 베리파이어를 세션 스토리지에 저장
				sessionStorage.setItem('code_verifier', codeVerifier);
				sessionStorage.setItem('state', state);
			}

			generatedUrl = `${baseUrl}?${params.toString()}`;
			showResult = true;
			
			toast.success('인증 URL이 생성되었습니다.');
		} catch (error) {
			console.error('Failed to generate authorization URL:', error);
			toast.error('URL 생성에 실패했습니다.');
		}
	}

	function copyUrl() {
		navigator.clipboard.writeText(generatedUrl);
		toast.success('URL이 클립보드에 복사되었습니다.');
	}

	function openUrl() {
		window.open(generatedUrl, '_blank');
	}

	function resetTest() {
		selectedClient = null;
		scopes = 'openid profile email';
		responseType = 'code';
		usePKCE = true;
		generatedUrl = '';
		showResult = false;
	}
</script>

<DashboardLayout
	title="OAuth2 테스터"
	description="OAuth2 인증 플로우를 테스트하고 검증하세요."
	showBackButton={true}
>
	{#snippet children()}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- 설정 패널 -->
			<Card>
				<h3 class="mb-4 text-lg font-medium text-gray-900">테스트 설정</h3>
				
				<div class="space-y-4">
					<!-- 클라이언트 선택 -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">클라이언트 선택 *</label>
						<div class="space-y-2">
							{#each clients as client}
								<div
									class="border border-gray-200 rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50
										{selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : ''}"
									onclick={() => selectedClient = client}
								>
									<div class="flex items-center justify-between">
										<div>
											<h4 class="font-medium text-gray-900">{client.name}</h4>
											<p class="text-sm text-gray-500">{client.clientId}</p>
										</div>
										<input
											type="radio"
											name="client"
											checked={selectedClient?.id === client.id}
											class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
										/>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Response Type -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Response Type</label>
						<select
							bind:value={responseType}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="code">Authorization Code</option>
							<option value="token">Implicit (Token)</option>
							<option value="id_token">OpenID Connect (ID Token)</option>
							<option value="code id_token">Hybrid Flow</option>
						</select>
					</div>

					<!-- Scopes -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">권한 범위 (Scopes)</label>
						<input
							type="text"
							bind:value={scopes}
							placeholder="openid profile email"
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">공백으로 구분하여 입력해주세요.</p>
					</div>

					<!-- PKCE 설정 -->
					{#if responseType === 'code'}
						<div>
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={usePKCE}
									class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<span class="ml-2 text-sm text-gray-700">PKCE 사용 (권장)</span>
							</label>
							<p class="mt-1 text-xs text-gray-500">
								Proof Key for Code Exchange - 보안 강화를 위해 권장됩니다.
							</p>
						</div>
					{/if}

					<!-- 실행 버튼 -->
					<div class="pt-4 border-t border-gray-200">
						<div class="flex space-x-2">
							<Button onclick={generateAuthorizationUrl} class="flex-1">
								<i class="fas fa-play mr-2"></i>
								URL 생성
							</Button>
							<Button variant="outline" onclick={resetTest}>
								<i class="fas fa-redo mr-2"></i>
								초기화
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<!-- 결과 패널 -->
			<Card>
				<h3 class="mb-4 text-lg font-medium text-gray-900">테스트 결과</h3>
				
				{#if !showResult}
					<div class="text-center py-8">
						<i class="fas fa-flask text-4xl text-gray-400 mb-4"></i>
						<p class="text-gray-500">설정을 완료하고 "URL 생성" 버튼을 클릭하세요.</p>
					</div>
				{:else}
					<div class="space-y-4">
						<!-- 생성된 URL -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">생성된 인증 URL</label>
							<div class="p-3 bg-gray-50 border border-gray-200 rounded-md">
								<code class="text-xs text-gray-800 break-all">
									{generatedUrl}
								</code>
							</div>
							<div class="mt-2 flex space-x-2">
								<Button size="sm" onclick={copyUrl}>
									<i class="fas fa-copy mr-2"></i>
									복사
								</Button>
								<Button size="sm" variant="outline" onclick={openUrl}>
									<i class="fas fa-external-link-alt mr-2"></i>
									새 탭에서 열기
								</Button>
							</div>
						</div>

						<!-- 파라미터 분석 -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">URL 파라미터 분석</label>
							<div class="space-y-2">
								{#if generatedUrl}
									{@const url = new URL(generatedUrl)}
									{@const params = url.searchParams}
									{#each [...params.entries()] as [key, value]}
										<div class="flex text-sm">
											<span class="w-32 font-medium text-gray-600">{key}:</span>
											<span class="text-gray-900 break-all">{value}</span>
										</div>
									{/each}
								{/if}
							</div>
						</div>

						<!-- 다음 단계 안내 -->
						<div class="p-4 bg-blue-50 border border-blue-200 rounded-md">
							<div class="flex">
								<i class="fas fa-info-circle text-blue-400"></i>
								<div class="ml-3">
									<h4 class="text-sm font-medium text-blue-800">다음 단계</h4>
									<div class="mt-2 text-sm text-blue-700">
										<ol class="list-decimal list-inside space-y-1">
											<li>생성된 URL을 브라우저에서 열어보세요.</li>
											<li>로그인 페이지에서 인증을 진행하세요.</li>
											<li>리다이렉트된 URL에서 인증 코드를 확인하세요.</li>
											{#if responseType === 'code'}
												<li>인증 코드를 사용하여 토큰을 요청하세요.</li>
											{/if}
										</ol>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</Card>
		</div>

		<!-- 도움말 섹션 -->
		<Card class="mt-6">
			<h3 class="mb-4 text-lg font-medium text-gray-900">OAuth2 플로우 가이드</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div class="p-4 border border-gray-200 rounded-lg">
					<div class="flex items-center mb-2">
						<i class="fas fa-key text-blue-600 mr-2"></i>
						<h4 class="font-medium text-gray-900">Authorization Code</h4>
					</div>
					<p class="text-sm text-gray-600">
						가장 안전한 방식으로, 서버 사이드 애플리케이션에 권장됩니다.
					</p>
				</div>

				<div class="p-4 border border-gray-200 rounded-lg">
					<div class="flex items-center mb-2">
						<i class="fas fa-bolt text-yellow-600 mr-2"></i>
						<h4 class="font-medium text-gray-900">Implicit Flow</h4>
					</div>
					<p class="text-sm text-gray-600">
						클라이언트 사이드 애플리케이션용이지만, 보안상 권장되지 않습니다.
					</p>
				</div>

				<div class="p-4 border border-gray-200 rounded-lg">
					<div class="flex items-center mb-2">
						<i class="fas fa-shield-alt text-green-600 mr-2"></i>
						<h4 class="font-medium text-gray-900">PKCE</h4>
					</div>
					<p class="text-sm text-gray-600">
						코드 가로채기 공격을 방지하는 보안 확장 기능입니다.
					</p>
				</div>
			</div>
		</Card>
	{/snippet}
</DashboardLayout>