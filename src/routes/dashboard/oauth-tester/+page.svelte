<script lang="ts">
	import { DashboardLayout, Card, Button, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createApiUrl } from '$lib/config/env';
	import { CryptoUtils } from '$lib/utils/crypto.util';
	import type { Client } from '$lib/types/oauth.types';

	// 상태 변수들
	let clients = $state<Client[]>([]);
	let isLoading = $state(true);
	let selectedClient = $state<Client | null>(null);
	let responseType = $state('code');
	let usePKCE = $state(true);
	let generatedUrl = $state('');
	let showResult = $state(false);
	let isCopying = $state(false);
	let copySuccess = $state(false);

	// 스코프 관련 상태
	let selectedScopes = $state<Set<string>>(new Set(['openid', 'profile', 'email']));
	let showScopeSelector = $state(false);

	// 사용 가능한 스코프 정의
	const availableScopes = [
		{ id: 'openid', name: 'OpenID', description: 'OpenID Connect 인증' },
		{ id: 'profile', name: 'Profile', description: '사용자 프로필 정보' },
		{ id: 'email', name: 'Email', description: '이메일 주소' },
		{ id: 'address', name: 'Address', description: '주소 정보' },
		{ id: 'phone', name: 'Phone', description: '전화번호' },
		{ id: 'offline_access', name: 'Offline Access', description: '리프레시 토큰 발급' },
		{ id: 'read', name: 'Read', description: '읽기 권한' },
		{ id: 'write', name: 'Write', description: '쓰기 권한' },
		{ id: 'admin', name: 'Admin', description: '관리자 권한' }
	];

	const toast = useToast();

	// 스코프 관련 함수들
	function getScopesString() {
		return Array.from(selectedScopes).join(' ');
	}

	function toggleScope(scopeId: string) {
		if (selectedScopes.has(scopeId)) {
			selectedScopes.delete(scopeId);
		} else {
			selectedScopes.add(scopeId);
		}
		selectedScopes = new Set(selectedScopes); // reactivity trigger
	}

	function selectAllScopes() {
		selectedScopes = new Set(availableScopes.map(s => s.id));
	}

	function clearAllScopes() {
		selectedScopes.clear();
		selectedScopes = new Set(selectedScopes);
	}

	function toggleScopeSelector() {
		showScopeSelector = !showScopeSelector;
	}

	onMount(async () => {
		await loadClients();
		// 초기 스코프 문자열 설정은 getScopesString()으로 계산됨
	});

	async function loadClients() {
		try {
			isLoading = true;
			const response = await apiClient.getClients();
			clients = Array.isArray(response) ? response.filter((c) => c.isActive) : [];
		} catch (error) {
			console.error('Failed to load clients:', error);
			toast.error('클라이언트 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// OAuth 테스트 실행
	async function generateAuthorizationUrl() {
		if (!selectedClient) {
			toast.error('클라이언트를 선택해주세요.');
			return;
		}

		if (!selectedClient.redirectUris.length) {
			toast.error('선택한 클라이언트에 리다이렉트 URI가 설정되지 않았습니다.');
			return;
		}

		try {
			const baseUrl = createApiUrl('/oauth2/authorize');
			const redirectUri = selectedClient.redirectUris[0];
			const state = CryptoUtils.generateRandomString(32);

			// 선택된 스코프들을 문자열로 변환
			const scopeString = getScopesString();

			const params = new URLSearchParams({
				response_type: responseType,
				client_id: selectedClient.clientId,
				redirect_uri: redirectUri,
				scope: scopeString,
				state
			});

			if (usePKCE && responseType === 'code') {
				try {
					const codeVerifier = CryptoUtils.generateCodeVerifier();
					const codeChallenge = await CryptoUtils.generateCodeChallenge(codeVerifier);
					params.append('code_challenge', codeChallenge);
					params.append('code_challenge_method', 'S256');

					// 코드 베리파이어를 세션 스토리지에 저장
					sessionStorage.setItem('code_verifier', codeVerifier);
					sessionStorage.setItem('state', state);
				} catch (error) {
					console.error('Failed to generate PKCE parameters:', error);
					toast.error('PKCE 파라미터 생성에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
					return;
				}
			} else if (responseType === 'code' && !usePKCE) {
				toast.warning('PKCE를 사용하지 않으면 보안이 취약해질 수 있습니다. 프로덕션 환경에서는 PKCE 사용을 권장합니다.');
			}

			generatedUrl = `${baseUrl}?${params.toString()}`;
			showResult = true;

			toast.success('인증 URL이 생성되었습니다.');
		} catch (error) {
			console.error('Failed to generate authorization URL:', error);
			toast.error('URL 생성에 실패했습니다.');
		}
	}

	async function copyUrl() {
		if (!generatedUrl || isCopying) return;

		try {
			isCopying = true;
			copySuccess = false;

			await navigator.clipboard.writeText(generatedUrl);

			copySuccess = true;
			toast.success('URL이 클립보드에 복사되었습니다!');

			// 2초 후 성공 상태 초기화
			setTimeout(() => {
				copySuccess = false;
			}, 2000);

		} catch (error) {
			console.error('Failed to copy URL:', error);
			toast.error('URL 복사에 실패했습니다. 수동으로 복사해주세요.');
		} finally {
			isCopying = false;
		}
	}

	function openUrl() {
		window.open(generatedUrl, '_blank');
	}

	function resetTest() {
		selectedClient = null;
		selectedScopes = new Set(['openid', 'profile', 'email']);
		responseType = 'code';
		usePKCE = true;
		generatedUrl = '';
		showResult = false;
		showScopeSelector = false;
	}
</script>

<DashboardLayout
	title="OAuth2 테스터"
	description="OAuth2 인증 플로우를 테스트하고 검증하세요."
	showBackButton={true}
>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- 설정 패널 -->
		<Card>
			<h3 class="mb-4 text-lg font-medium text-gray-900">테스트 설정</h3>

			<div class="space-y-4">
				<!-- 클라이언트 선택 -->
				<div>
					<label for="client-select" class="mb-2 block text-sm font-medium text-gray-700"
						>클라이언트 선택 *</label
					>

					{#if isLoading}
						<div class="py-4 text-center">
							<i class="fas fa-spinner fa-spin mr-2 text-gray-400"></i>
							클라이언트 목록을 불러오는 중...
						</div>
					{:else if clients.length === 0}
						<div class="py-4 text-center text-gray-500">
							<i class="fas fa-exclamation-circle mr-2"></i>
							활성화된 클라이언트가 없습니다.
							<button
								onclick={() => goto('/dashboard/clients')}
								class="ml-1 text-blue-600 underline hover:text-blue-800"
							>
								클라이언트 생성하기
							</button>
						</div>
					{:else}
						<div class="space-y-2">
							{#each clients as client (client.id)}
								<div
									class="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50
											{selectedClient?.id === client.id ? 'border-blue-500 bg-blue-50' : ''}"
									onclick={() => (selectedClient = client)}
									role="button"
									tabindex="0"
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											selectedClient = client;
										}
									}}
								>
									<div class="flex items-center justify-between">
										<div>
											<h4 class="font-medium text-gray-900">{client.name}</h4>
											<p class="text-sm text-gray-500">{client.clientId}</p>
											<div class="mt-1 text-xs text-gray-400">
												리다이렉트 URI: {client.redirectUris.join(', ')}
											</div>
										</div>
										<input
											type="radio"
											name="client"
											checked={selectedClient?.id === client.id}
											class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
											readonly
										/>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Response Type -->
				<div>
					<label for="response-type" class="mb-2 block text-sm font-medium text-gray-700"
						>Response Type</label
					>
					<select
						id="response-type"
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
					<label for="scopes" class="mb-2 block text-sm font-medium text-gray-700"
						>권한 범위 (Scopes)</label
					>

					<!-- 현재 선택된 스코프 표시 -->
					<div class="mb-2 flex flex-wrap gap-1">
						{#each Array.from(selectedScopes) as scopeId}
							{@const scope = availableScopes.find(s => s.id === scopeId)}
							{#if scope}
								<span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
									{scope.name}
									<button
										onclick={() => toggleScope(scopeId)}
										class="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
										title="제거"
										aria-label="스코프 제거"
									>
										<i class="fas fa-times text-xs"></i>
									</button>
								</span>
							{/if}
						{/each}
						{#if selectedScopes.size === 0}
							<span class="text-sm text-gray-500">선택된 스코프가 없습니다.</span>
						{/if}
					</div>

					<!-- 스코프 선택 토글 버튼 -->
					<Button
						variant="outline"
						size="sm"
						onclick={toggleScopeSelector}
						class="mb-2"
					>
						<i class="fas {showScopeSelector ? 'fa-chevron-up' : 'fa-chevron-down'} mr-2"></i>
						{showScopeSelector ? '스코프 선택기 숨기기' : '스코프 선택하기'}
					</Button>

					<!-- 스코프 선택기 -->
					{#if showScopeSelector}
						<div class="rounded-md border border-gray-200 bg-white p-4">
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-medium text-gray-900">사용 가능한 스코프</h4>
								<div class="flex space-x-2">
									<Button
										variant="ghost"
										size="sm"
										onclick={selectAllScopes}
										class="text-xs"
									>
										전체 선택
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={clearAllScopes}
										class="text-xs text-red-600 hover:text-red-700"
									>
										전체 해제
									</Button>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
								{#each availableScopes as scope (scope.id)}
									<label class="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
										<input
											type="checkbox"
											checked={selectedScopes.has(scope.id)}
											onchange={() => toggleScope(scope.id)}
											class="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<div class="flex-1">
											<div class="flex items-center">
												<span class="text-sm font-medium text-gray-900">{scope.name}</span>
												<code class="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
													{scope.id}
												</code>
											</div>
											<p class="text-xs text-gray-600 mt-1">{scope.description}</p>
										</div>
									</label>
								{/each}
							</div>

							<!-- 선택된 스코프 미리보기 -->
							{#if selectedScopes.size > 0}
								<div class="mt-4 pt-3 border-t border-gray-200">
									<p class="text-xs text-gray-600 mb-1">선택된 스코프:</p>
									<code class="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
										{getScopesString()}
									</code>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- PKCE 설정 -->
				{#if responseType === 'code'}
					<div>
						<label class="flex items-center">
							<input
								type="checkbox"
								bind:checked={usePKCE}
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="ml-2 text-sm text-gray-700">PKCE 사용 (권장)</span>
						</label>
						<p class="mt-1 text-xs text-gray-500">
							Proof Key for Code Exchange - 보안 강화를 위해 권장됩니다.
						</p>
					</div>
				{/if}

				<!-- 실행 버튼 -->
				<div class="border-t border-gray-200 pt-4">
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
				<div class="py-8 text-center">
					<i class="fas fa-flask mb-4 text-4xl text-gray-400"></i>
					<p class="text-gray-500">설정을 완료하고 "URL 생성" 버튼을 클릭하세요.</p>
				</div>
			{:else}
				<div class="space-y-4">
					<!-- 생성된 URL -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<h4 class="block text-sm font-medium text-gray-700">생성된 인증 URL</h4>
							{#if copySuccess}
								<span class="text-xs text-green-600 font-medium animate-pulse">
									<i class="fas fa-check-circle mr-1"></i>
									복사 완료
								</span>
							{/if}
						</div>
						<div class="rounded-md border p-3 transition-all duration-300
							{copySuccess
								? 'border-green-300 bg-green-50 shadow-md transform scale-[1.02]'
								: 'border-gray-200 bg-gray-50'}">
							<code class="text-xs break-all text-gray-800">
								{generatedUrl}
							</code>
						</div>
						<div class="mt-2 flex space-x-2">
							<Button
								size="sm"
								onclick={copyUrl}
								disabled={isCopying}
								class="transition-all duration-200 {copySuccess
									? 'bg-green-600 hover:bg-green-700 text-white shadow-lg transform scale-105'
									: 'bg-blue-600 hover:bg-blue-700'}"
							>
								{#if isCopying}
									<i class="fas fa-spinner fa-spin mr-2"></i>
									복사 중...
								{:else if copySuccess}
									<i class="fas fa-check mr-2"></i>
									복사됨!
								{:else}
									<i class="fas fa-copy mr-2"></i>
									복사
								{/if}
							</Button>
							<Button size="sm" variant="outline" onclick={openUrl}>
								<i class="fas fa-external-link-alt mr-2"></i>
								새 탭에서 열기
							</Button>
						</div>
					</div>

					<!-- 파라미터 분석 -->
					<div>
						<h4 class="mb-2 block text-sm font-medium text-gray-700">URL 파라미터 분석</h4>
						<div class="space-y-2">
							{#if generatedUrl}
								{@const url = new URL(generatedUrl)}
								{@const params = url.searchParams}
								{#each [...params.entries()] as [key, value] (key)}
									<div class="flex text-sm">
										<span class="w-32 font-medium text-gray-600">{key}:</span>
										<span class="break-all text-gray-900">{value}</span>
									</div>
								{/each}
							{/if}
						</div>
					</div>

					<!-- 다음 단계 안내 -->
					<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
						<div class="flex">
							<i class="fas fa-info-circle text-blue-400"></i>
							<div class="ml-3">
								<h4 class="text-sm font-medium text-blue-800">다음 단계</h4>
								<div class="mt-2 text-sm text-blue-700">
									<ol class="list-inside list-decimal space-y-1">
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
			<div class="rounded-lg border border-gray-200 p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-key mr-2 text-blue-600"></i>
					<h4 class="font-medium text-gray-900">Authorization Code</h4>
				</div>
				<p class="text-sm text-gray-600">
					가장 안전한 방식으로, 서버 사이드 애플리케이션에 권장됩니다.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-bolt mr-2 text-yellow-600"></i>
					<h4 class="font-medium text-gray-900">Implicit Flow</h4>
				</div>
				<p class="text-sm text-gray-600">
					클라이언트 사이드 애플리케이션용이지만, 보안상 권장되지 않습니다.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-shield-alt mr-2 text-green-600"></i>
					<h4 class="font-medium text-gray-900">PKCE</h4>
				</div>
				<p class="text-sm text-gray-600">코드 가로채기 공격을 방지하는 보안 확장 기능입니다.</p>
			</div>
		</div>
	</Card>
</DashboardLayout>
