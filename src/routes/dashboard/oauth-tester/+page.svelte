<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { Card, Button, Badge, Loading } from '$lib';
	import { authState, useToast } from '$lib';
	import { createApiUrl } from '$lib/config/env';
	import { CryptoUtils } from '$lib/utils/crypto.util';

	// 상태 변수들
	let isLoading = $state(true);
	let isAuthenticated = $state(false);
	let user = $state(null);
	let clients = $state([]);
	let isLoadingClients = $state(false);
	let selectedClient = $state(null);
	let scopes = $state('openid profile email');
	let responseType = $state('code');
	let usePKCE = $state(true);
	let generatedUrl = $state('');
	let showModal = $state(false);

	const toast = useToast();

	interface OAuthClient {
		id: string;
		name: string;
		description?: string;
		redirect_uris: string[];
		scopes: string[];
		grant_types: string[];
		response_types: string[];
		is_confidential: boolean;
		client_secret?: string;
		created_at: string;
		updated_at: string;
	}

	// 초기화
	onMount(() => {
		// 인증 상태 확인
		const unsubscribe = authState.subscribe((state) => {
			isAuthenticated = state.isAuthenticated;
			user = state.user;
			isLoading = state.isLoading;

			// 인증되었고 아직 클라이언트를 로드하지 않았다면 로드
			if (state.isAuthenticated && !isLoadingClients && clients.length === 0) {
				loadClients();
			}
		});

		// 현재 상태도 확인
		const currentState = get(authState);
		isAuthenticated = currentState.isAuthenticated;
		user = currentState.user;
		isLoading = currentState.isLoading;

		if (currentState.isAuthenticated && clients.length === 0) {
			loadClients();
		}

		return unsubscribe;
	});

	// 클라이언트 목록 로드
	async function loadClients() {
		if (isLoadingClients) return;

		isLoadingClients = true;
		
		try {
			const token = localStorage.getItem('auth_token');
			
			if (!token) {
				toast.error('로그인이 필요합니다.');
				return;
			}

			const response = await fetch(createApiUrl('/auth/clients'), {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					toast.error('클라이언트 API를 찾을 수 없습니다.');
				} else if (response.status === 401) {
					toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
				} else {
					toast.error(`클라이언트 로딩 실패: ${response.status}`);
				}
				return;
			}

			const data = await response.json();
			
			if (Array.isArray(data)) {
				clients = data.map((client: any) => ({
					...client,
					redirect_uris: Array.isArray(client.redirect_uris) 
						? client.redirect_uris 
						: client.redirect_uris?.split(',').map(s => s.trim()).filter(Boolean) || [],
					scopes: Array.isArray(client.scopes) 
						? client.scopes 
						: client.scopes?.split(',').map(s => s.trim()).filter(Boolean) || [],
					grant_types: Array.isArray(client.grant_types) 
						? client.grant_types 
						: client.grant_types?.split(',').map(s => s.trim()).filter(Boolean) || [],
					response_types: Array.isArray(client.response_types) 
						? client.response_types 
						: client.response_types?.split(',').map(s => s.trim()).filter(Boolean) || []
				}));

				if (clients.length === 0) {
					toast.info('등록된 클라이언트가 없습니다.');
				} else {
					toast.success(`${clients.length}개의 클라이언트를 불러왔습니다.`);
				}
			} else {
				toast.error('올바르지 않은 응답 형식입니다.');
			}
		} catch (error) {
			console.error('클라이언트 로딩 오류:', error);
			toast.error('클라이언트를 불러오는 중 오류가 발생했습니다.');
		} finally {
			isLoadingClients = false;
		}
	}

	// 클라이언트 선택
	function selectClient(client: OAuthClient) {
		selectedClient = client;
		if (client.response_types.length > 0) {
			responseType = client.response_types[0];
		}
	}

	// OAuth2 URL 생성
	async function generateAuthUrl() {
		if (!selectedClient) {
			toast.error('클라이언트를 선택해주세요.');
			return;
		}

		try {
			const params = new URLSearchParams();
			params.append('client_id', selectedClient.id);
			params.append('response_type', responseType);
			params.append('scope', scopes);

			// 첫 번째 redirect URI 사용
			if (selectedClient.redirect_uris.length > 0) {
				params.append('redirect_uri', selectedClient.redirect_uris[0]);
			}

			// state 생성
			const state = CryptoUtils.generateRandomString(32);
			params.append('state', state);

			// PKCE 사용 시
			if (usePKCE) {
				const codeVerifier = CryptoUtils.generateCodeVerifier();
				const codeChallenge = await CryptoUtils.generateCodeChallenge(codeVerifier);
				
				params.append('code_challenge', codeChallenge);
				params.append('code_challenge_method', 'S256');

				// 로컬 스토리지에 저장
				localStorage.setItem('oauth2_code_verifier', codeVerifier);
				localStorage.setItem('oauth2_state', state);
			}

			generatedUrl = `${createApiUrl('/oauth2/authorize')}?${params.toString()}`;
			showModal = true;
			toast.success('OAuth2 URL이 생성되었습니다.');
		} catch (error) {
			console.error('URL 생성 오류:', error);
			toast.error('URL 생성 중 오류가 발생했습니다.');
		}
	}

	// 클립보드 복사
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedUrl);
			toast.success('클립보드에 복사되었습니다.');
		} catch (error) {
			toast.error('클립보드 복사에 실패했습니다.');
		}
	}

	// 새 탭에서 열기
	function openInNewTab() {
		if (generatedUrl) {
			window.open(generatedUrl, '_blank');
		}
	}
</script>

<svelte:head>
	<title>OAuth2 테스터 - FlowAuth</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 space-y-6">
	<div class="flex justify-between items-center">
		<h1 class="text-3xl font-bold text-gray-800">OAuth2 테스터</h1>
		{#if user}
			<div class="text-sm text-gray-600">
				안녕하세요, {user.username || user.email}님!
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<Loading />
		</div>
	{:else if !isAuthenticated}
		<div class="text-center p-8">
			<h2 class="text-2xl font-bold text-gray-800 mb-4">로그인이 필요합니다</h2>
			<p class="text-gray-600 mb-6">OAuth2 테스터를 사용하려면 먼저 로그인해주세요.</p>
			<Button onclick={() => window.location.href = '/auth/login'}>
				로그인하기
			</Button>
		</div>
	{:else}
		<!-- 클라이언트 목록 -->
		<Card>
			<div slot="title" class="flex justify-between items-center">
				<h2 class="text-xl font-semibold">등록된 클라이언트</h2>
				<Button 
					onclick={loadClients} 
					disabled={isLoadingClients}
					variant="secondary"
					class="text-sm"
				>
					{#if isLoadingClients}
						<i class="fas fa-spinner fa-spin mr-1"></i>
						로딩...
					{:else}
						<i class="fas fa-sync mr-1"></i>
						새로고침
					{/if}
				</Button>
			</div>

			<div slot="content">
				{#if isLoadingClients}
					<div class="flex justify-center items-center h-32">
						<Loading />
					</div>
				{:else if clients.length === 0}
					<div class="text-center py-8">
						<i class="fas fa-folder-open text-4xl text-gray-400 mb-4"></i>
						<p class="text-gray-600">등록된 클라이언트가 없습니다.</p>
						<p class="text-sm text-gray-500 mt-2">관리자에게 문의하여 테스트 클라이언트를 등록해주세요.</p>
					</div>
				{:else}
					<div class="grid gap-4">
						{#each clients as client (client.id)}
							<div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors {selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : ''}">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<h3 class="font-semibold text-lg">{client.name}</h3>
										{#if client.description}
											<p class="text-gray-600 text-sm mt-1">{client.description}</p>
										{/if}
										
										<div class="mt-3 space-y-2">
											<div class="flex items-center space-x-2">
												<span class="text-sm font-medium">Client ID:</span>
												<code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{client.id}</code>
											</div>
											
											<div class="flex items-center space-x-2">
												<span class="text-sm font-medium">Type:</span>
												<Badge variant={client.is_confidential ? 'success' : 'secondary'}>
													{client.is_confidential ? 'Confidential' : 'Public'}
												</Badge>
											</div>

											<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
												<div>
													<span class="text-sm font-medium">Redirect URIs:</span>
													<div class="mt-1">
														{#each client.redirect_uris as uri}
															<div class="text-xs bg-blue-50 px-2 py-1 rounded mt-1 font-mono">{uri}</div>
														{/each}
													</div>
												</div>
												
												<div>
													<span class="text-sm font-medium">Scopes:</span>
													<div class="mt-1 flex flex-wrap gap-1">
														{#each client.scopes as scope}
															<Badge variant="secondary" class="text-xs">{scope}</Badge>
														{/each}
													</div>
												</div>
											</div>
										</div>
									</div>
									
									<Button
										onclick={() => selectClient(client)}
										variant={selectedClient?.id === client.id ? 'default' : 'secondary'}
										class="ml-4 shrink-0"
									>
										{selectedClient?.id === client.id ? '선택됨' : '선택'}
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</Card>

		<!-- OAuth2 URL 생성기 -->
		{#if selectedClient}
			<Card>
				<div slot="title">
					<h2 class="text-xl font-semibold">OAuth2 URL 생성기</h2>
				</div>

				<div slot="content" class="space-y-4">
					<div class="bg-blue-50 p-4 rounded-lg">
						<h3 class="font-semibold text-blue-800">선택된 클라이언트: {selectedClient.name}</h3>
						<p class="text-sm text-blue-600 font-mono">Client ID: {selectedClient.id}</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="response-type" class="block text-sm font-medium mb-2">Response Type</label>
							<select 
								id="response-type" 
								bind:value={responseType} 
								class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								{#each selectedClient.response_types as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="scopes" class="block text-sm font-medium mb-2">Scopes</label>
							<input
								id="scopes"
								type="text"
								bind:value={scopes}
								placeholder="openid profile email"
								class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="pkce"
							bind:checked={usePKCE}
							class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label for="pkce" class="text-sm font-medium">PKCE 사용 (권장)</label>
					</div>

					<Button onclick={generateAuthUrl} class="w-full">
						<i class="fas fa-link mr-2"></i>
						OAuth2 URL 생성
					</Button>
				</div>
			</Card>
		{/if}

		<!-- 도움말 -->
		<Card>
			<div slot="title">
				<h2 class="text-xl font-semibold">사용 방법</h2>
			</div>

			<div slot="content" class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 class="font-semibold text-green-700">1. 클라이언트 선택</h3>
						<p class="text-sm text-gray-600 mt-1">위의 목록에서 테스트할 OAuth2 클라이언트를 선택하세요.</p>
					</div>
					<div>
						<h3 class="font-semibold text-blue-700">2. 옵션 설정</h3>
						<p class="text-sm text-gray-600 mt-1">Response Type, Scopes 등을 설정하세요. PKCE 사용을 권장합니다.</p>
					</div>
					<div>
						<h3 class="font-semibold text-purple-700">3. URL 생성 및 테스트</h3>
						<p class="text-sm text-gray-600 mt-1">생성된 URL을 새 탭에서 열어 OAuth2 플로우를 테스트하세요.</p>
					</div>
					<div>
						<h3 class="font-semibold text-orange-700">4. 인증 완료</h3>
						<p class="text-sm text-gray-600 mt-1">인증이 완료되면 설정된 Redirect URI로 Authorization Code가 전달됩니다.</p>
					</div>
				</div>
			</div>
		</Card>
	{/if}
</div>

<!-- URL 생성 모달 -->
{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
			<div class="p-6">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-semibold">OAuth2 URL 생성 완료</h3>
					<button 
						onclick={() => showModal = false}
						class="text-gray-400 hover:text-gray-600"
						aria-label="모달 닫기"
					>
						<i class="fas fa-times"></i>
					</button>
				</div>
				
				<div class="space-y-4">
					<p class="text-sm text-gray-600">다음 URL이 생성되었습니다:</p>
					
					<div class="bg-gray-50 p-3 rounded-lg border">
						<code class="text-xs break-all font-mono">{generatedUrl}</code>
					</div>

					<div class="flex space-x-2">
						<Button
							onclick={copyToClipboard}
							variant="secondary"
							class="flex-1"
						>
							<i class="fas fa-copy mr-2"></i>
							복사
						</Button>
						<Button
							onclick={openInNewTab}
							class="flex-1"
						>
							<i class="fas fa-external-link-alt mr-2"></i>
							새 탭에서 열기
						</Button>
					</div>

					{#if usePKCE}
						<div class="text-xs text-gray-500 p-3 bg-yellow-50 rounded border border-yellow-200">
							<p><strong>참고:</strong> PKCE를 사용하여 <code>code_verifier</code>가 로컬 스토리지에 저장되었습니다.</p>
							<p>토큰 교환 시 이 값을 사용하세요.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}