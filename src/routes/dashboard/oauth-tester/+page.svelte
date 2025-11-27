<script lang="ts">
	import { slide } from 'svelte/transition';
	import { DashboardLayout, Card, Button, apiClient } from '$lib';
	import Alert from '$lib/components/Alert.svelte';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createApiUrl, env } from '$lib/config/env';
	import { CryptoUtils } from '$lib/utils/crypto.util';
	import type { Client } from '$lib/types/oauth.types';
	import { USER_TYPES } from '$lib';
	import { authState } from '$lib';
	import type { User } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faExclamationCircle,
		faInfoCircle,
		faTimes,
		faSpinner,
		faSync,
		faExclamationTriangle,
		faPlay,
		faRedo,
		faFlask,
		faCheckCircle,
		faCheck,
		faCopy,
		faArrowRight,
		faExternalLinkAlt,
		faChevronUp,
		faChevronDown
	} from '@fortawesome/free-solid-svg-icons';

	const toast = useToast();

	// 상태 변수들
	let user = $state<User | null>(null);
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
	let selectedScopes = $state<Set<string>>(new Set(['openid', 'profile']));
	let showScopeSelector = $state(false);
	let availableScopes = $state<{ id: string; name: string; description: string }[]>([]);
	let scopesLoading = $state(false);
	let scopesError = $state<string | null>(null);

	// 테스트 콜백 URL 확인
	let testCallbackUrl = $derived(`${env.FRONTEND_URL}/callback`);
	let hasTestCallbackUrl = $derived(
		selectedClient ? selectedClient.redirectUris.includes(testCallbackUrl) : false
	);

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
		selectedScopes = new Set(availableScopes.map((s) => s.id));
	}

	function clearAllScopes() {
		selectedScopes.clear();
		selectedScopes = new Set(selectedScopes);
	}

	function toggleScopeSelector() {
		showScopeSelector = !showScopeSelector;
	}

	onMount(() => {
		// 사용자 유형 검증
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			if (user && user.userType !== USER_TYPES.DEVELOPER) {
				// 일반 사용자는 접근 불가
				goto('/dashboard');
				return;
			}
		});

		Promise.all([loadClients(), loadAvailableScopes()]);

		// cleanup 함수 반환
		return () => {
			unsubscribe();
		};
	});

	async function loadClients() {
		try {
			isLoading = true;
			const response = await apiClient.getClients();
			clients = Array.isArray(response) ? response.filter((c) => c.isActive) : [];
		} catch {
			toast.error('클라이언트 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoading = false;
		}
	}

	async function loadAvailableScopes() {
		try {
			scopesLoading = true;
			scopesError = null;
			// 서버에서 스코프 목록을 가져옴
			const serverScopes = await apiClient.getAvailableScopes();
			availableScopes = serverScopes.map((scope) => ({
				id: scope.id,
				name: scope.name,
				description: scope.description
			}));
		} catch (error) {
			scopesError = '스코프 목록을 불러오는데 실패했습니다.';
			toast.error('스코프 목록을 불러오는데 실패했습니다.');
			console.error('Failed to load scopes:', error);

			// 오류 시에도 기본 스코프들로 폴백
			availableScopes = [
				{
					id: 'openid',
					name: 'OpenID Connect',
					description: 'OpenID Connect 인증을 위한 기본 스코프'
				},
				{
					id: 'profile',
					name: '프로필 정보 읽기',
					description: '사용자 프로필 정보 (이름, 생년월일, 지역, 사진 등) 접근'
				},
				{ id: 'email', name: '이메일 주소 읽기', description: '사용자 이메일 주소 접근' }
			];
		} finally {
			scopesLoading = false;
		}
	}

	// OAuth 테스트 실행
	async function generateAuthorizationUrl() {
		if (!selectedClient) {
			toast.error('클라이언트를 선택해주세요.');
			return;
		}

		if (!hasTestCallbackUrl) {
			toast.error(
				'테스트 콜백 URL이 클라이언트에 설정되지 않았습니다. 먼저 클라이언트 설정에서 콜백 URL을 추가해주세요.'
			);
			return;
		}

		if (!selectedClient.redirectUris.length) {
			toast.error('선택한 클라이언트에 리다이렉트 URI가 설정되지 않았습니다.');
			return;
		}

		try {
			const baseUrl = createApiUrl('/oauth2/authorize');
			const redirectUri = hasTestCallbackUrl ? testCallbackUrl : selectedClient.redirectUris[0];
			const state = CryptoUtils.generateRandomString(32);
			let nonce: string | undefined;

			// OIDC response type인 경우 nonce 생성
			if (responseType.includes('id_token')) {
				nonce = CryptoUtils.generateRandomString(32);
			}

			// 선택된 스코프들을 문자열로 변환
			const scopeString = getScopesString();

			const params = new URLSearchParams({
				response_type: responseType,
				client_id: selectedClient.clientId,
				redirect_uri: redirectUri,
				scope: scopeString,
				state
			});

			// 콜백에서 사용할 값들을 세션 스토리지에 저장
			sessionStorage.setItem('client_id', selectedClient.clientId);
			sessionStorage.setItem('client_secret', selectedClient.clientSecret || '');
			sessionStorage.setItem('redirect_uri', redirectUri);
			sessionStorage.setItem('scope', scopeString);

			// 새 탭에서 열기를 대비해 localStorage에도 백업 저장 (시간 제한을 두어 보안 강화)
			const backupData: {
				client_id: string;
				client_secret: string;
				redirect_uri: string;
				scope: string;
				timestamp: number;
				state: string;
				oauth_nonce?: string;
				code_verifier?: string;
			} = {
				client_id: selectedClient.clientId,
				client_secret: selectedClient.clientSecret || '',
				redirect_uri: redirectUri,
				scope: scopeString,
				timestamp: Date.now(),
				state: state // state도 함께 저장하여 검증에 사용
			};
			localStorage.setItem('oauth_backup_data', JSON.stringify(backupData));

			// OIDC인 경우 nonce 추가
			if (nonce) {
				params.append('nonce', nonce);
				// nonce를 세션 스토리지에 저장하여 콜백에서 검증할 수 있도록
				sessionStorage.setItem('oauth_nonce', nonce);
				// OIDC nonce도 백업에 추가
				backupData.oauth_nonce = nonce;
			}

			// State를 세션 스토리지에 저장 (모든 flow에서 공통)
			sessionStorage.setItem('state', state);

			if (usePKCE && responseType.includes('code')) {
				try {
					const codeVerifier = CryptoUtils.generateCodeVerifier();
					const codeChallenge = await CryptoUtils.generateCodeChallenge(codeVerifier);
					params.append('code_challenge', codeChallenge);
					params.append('code_challenge_method', 'S256');

					// 코드 베리파이어를 세션 스토리지에 저장
					sessionStorage.setItem('code_verifier', codeVerifier);

					// localStorage 백업 데이터에 code_verifier 추가
					backupData.code_verifier = codeVerifier;
				} catch {
					toast.error('PKCE 파라미터 생성에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
					return;
				}
			} else if (responseType.includes('code') && !usePKCE) {
				toast.warning(
					'PKCE를 사용하지 않으면 보안이 취약해질 수 있습니다. 프로덕션 환경에서는 PKCE 사용을 권장합니다.'
				);
			}

			// 최종적으로 localStorage에 백업 데이터 저장 (모든 변경사항 반영)
			localStorage.setItem('oauth_backup_data', JSON.stringify(backupData));

			generatedUrl = `${baseUrl}?${params.toString()}`;
			showResult = true;

			toast.success('인증 URL이 생성되었습니다.');
		} catch {
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
		} catch {
			toast.error('URL 복사에 실패했습니다. 수동으로 복사해주세요.');
		} finally {
			isCopying = false;
		}
	}

	function openUrl() {
		window.open(generatedUrl, '_blank');
	}

	function openUrlSameTab() {
		window.location.href = generatedUrl;
	}

	function resetTest() {
		selectedClient = null;
		// 기본 스코프로 재설정
		const defaultScopeIds = ['openid', 'profile'];
		const validDefaultScopes = defaultScopeIds.filter((id) =>
			availableScopes.some((scope) => scope.id === id)
		);
		selectedScopes = new Set(validDefaultScopes.length > 0 ? validDefaultScopes : []);

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
	<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- 설정 패널 -->
		<Card>
			<h3 class="mb-4 text-lg font-medium text-gray-900">테스트 설정</h3>

			<div class="space-y-4">
				<!-- 클라이언트 선택 -->
				<div>
					<label for="client-select" class="mb-2 block text-sm font-medium text-gray-700"
						>클라이언트 선택 *</label
					>

					{#if selectedClient && !hasTestCallbackUrl}
						<div transition:slide>
							<Alert
								variant="warning"
								title="테스트 콜백 URL 설정 필요"
								message="OAuth2 테스터를 사용하려면 클라이언트의 리다이렉트 URI에 테스트 콜백 URL을 추가해야 합니다."
								links={[
									{
										text: '클라이언트 설정으로 이동',
										url: '/dashboard/clients',
										icon: faArrowRight
									}
								]}
							/>
							<div class="mt-2 rounded-md bg-gray-50 p-3">
								<p class="text-sm text-gray-600">
									<strong>추가할 콜백 URL:</strong>
									<code class="ml-2 rounded bg-gray-100 px-2 py-1 text-xs">{testCallbackUrl}</code>
								</p>
							</div>
						</div>
					{/if}

					{#if isLoading}
						<div class="p-4">
							<!-- 클라이언트 선택 드롭다운 스켈레톤 -->
							<div class="space-y-3">
								<div class="h-10 w-full animate-pulse rounded-lg bg-gray-100"></div>
								<div class="text-center text-sm text-gray-500">
									<div class="inline-flex items-center space-x-2">
										<div class="h-4 w-4 animate-pulse rounded bg-gray-300"></div>
										<div class="h-4 w-32 animate-pulse rounded bg-gray-300"></div>
									</div>
								</div>
							</div>
						</div>
					{:else if clients.length === 0}
						<div class="py-4 text-center text-gray-500">
							<FontAwesomeIcon icon={faExclamationCircle} class="mr-2" />
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
						<option value="token">Implicit Grant (Access Token)</option>
						<option value="id_token">Implicit Grant (ID Token)</option>
						<option value="code id_token">Hybrid Flow (Code + ID Token)</option>
						<option value="token id_token">Implicit Grant (Access Token + ID Token)</option>
					</select>
					{#if responseType.includes('id_token')}
						<p class="mt-1 text-xs text-blue-600">
							<FontAwesomeIcon icon={faInfoCircle} class="mr-1" />
							OIDC 응답 타입입니다. openid 스코프가 필요합니다.
						</p>
					{/if}
				</div>

				<!-- Scopes -->
				<div>
					<label for="scopes" class="mb-2 block text-sm font-medium text-gray-700"
						>권한 범위 (Scopes)</label
					>

					<!-- 현재 선택된 스코프 표시 -->
					<div class="mb-2 flex flex-wrap gap-1">
						{#each Array.from(selectedScopes) as scopeId (scopeId)}
							{@const scope = availableScopes.find((s) => s.id === scopeId)}
							{#if scope}
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
								>
									{scope.name}
									<button
										onclick={() => toggleScope(scopeId)}
										class="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
										title="제거"
										aria-label="스코프 제거"
									>
										<FontAwesomeIcon icon={faTimes} class="text-xs" />
									</button>
								</span>
							{/if}
						{/each}
						{#if selectedScopes.size === 0}
							<span class="text-sm text-gray-500">선택된 스코프가 없습니다.</span>
						{/if}
					</div>

					<!-- 스코프 선택 토글 버튼 -->
					<Button variant="outline" size="sm" onclick={toggleScopeSelector} class="mb-2">
						<FontAwesomeIcon icon={showScopeSelector ? faChevronUp : faChevronDown} class="mr-2" />
						{showScopeSelector ? '스코프 선택기 숨기기' : '스코프 선택하기'}
					</Button>

					<!-- 스코프 선택기 -->
					{#if showScopeSelector}
						<div class="rounded-md border border-gray-200 bg-white p-4" transition:slide>
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-medium text-gray-900">사용 가능한 스코프</h4>
								<div class="flex space-x-2">
									<Button variant="ghost" size="sm" onclick={selectAllScopes} class="text-xs">
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
									<Button
										variant="ghost"
										size="sm"
										onclick={loadAvailableScopes}
										disabled={scopesLoading}
										class="text-xs"
									>
										{#if scopesLoading}
											<FontAwesomeIcon icon={faSpinner} spin class="mr-1" />
										{:else}
											<FontAwesomeIcon icon={faSync} class="mr-1" />
										{/if}
										새로고침
									</Button>
								</div>
							</div>

							{#if scopesLoading}
								<div class="py-8 text-center">
									<FontAwesomeIcon icon={faSpinner} spin class="mb-2 text-2xl text-gray-400" />
									<p class="text-sm text-gray-500">스코프를 불러오는 중...</p>
								</div>
							{:else if scopesError}
								<div class="py-8 text-center">
									<FontAwesomeIcon
										icon={faExclamationTriangle}
										class="mb-2 text-2xl text-red-400"
									/>
									<p class="text-sm text-red-600">{scopesError}</p>
									<Button variant="outline" size="sm" onclick={loadAvailableScopes} class="mt-2">
										다시 시도
									</Button>
								</div>
							{:else if availableScopes.length === 0}
								<div class="py-8 text-center">
									<FontAwesomeIcon icon={faInfoCircle} class="mb-2 text-2xl text-gray-400" />
									<p class="text-sm text-gray-500">사용 가능한 스코프가 없습니다.</p>
								</div>
							{:else}
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
									{#each availableScopes as scope (scope.id)}
										<label
											class="flex cursor-pointer items-start space-x-3 rounded p-2 hover:bg-gray-50"
										>
											<input
												type="checkbox"
												checked={selectedScopes.has(scope.id)}
												onchange={() => toggleScope(scope.id)}
												class="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<div class="flex-1">
												<div class="flex items-center">
													<span class="text-sm font-medium text-gray-900">{scope.name}</span>
													<code
														class="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
													>
														{scope.id}
													</code>
												</div>
												<p class="mt-1 text-xs text-gray-600">{scope.description}</p>
											</div>
										</label>
									{/each}
								</div>
							{/if}

							<!-- 선택된 스코프 미리보기 -->
							{#if selectedScopes.size > 0}
								<div class="mt-4 border-t border-gray-200 pt-3">
									<p class="mb-1 text-xs text-gray-600">선택된 스코프:</p>
									<code class="block rounded bg-gray-100 px-2 py-1 text-xs break-all">
										{getScopesString()}
									</code>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- PKCE 설정 -->
				{#if responseType.includes('code')}
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
							<FontAwesomeIcon icon={faPlay} class="mr-2" />
							URL 생성
						</Button>
						<Button variant="outline" onclick={resetTest}>
							<FontAwesomeIcon icon={faRedo} class="mr-2" />
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
					<FontAwesomeIcon icon={faFlask} class="mb-4 text-4xl text-gray-400" />
					<p class="text-gray-500">설정을 완료하고 "URL 생성" 버튼을 클릭하세요.</p>
				</div>
			{:else}
				<div class="space-y-4">
					<!-- 생성된 URL -->
					<div>
						<div class="mb-2 flex items-center justify-between">
							<h4 class="block text-sm font-medium text-gray-700">생성된 인증 URL</h4>
							{#if copySuccess}
								<span class="animate-pulse text-xs font-medium text-green-600">
									<FontAwesomeIcon icon={faCheckCircle} class="mr-1" />
									복사 완료
								</span>
							{/if}
						</div>
						<div
							class="rounded-md border p-3 transition-all duration-300
							{copySuccess
								? 'scale-[1.02] transform border-green-300 bg-green-50 shadow-md'
								: 'border-gray-200 bg-gray-50'}"
						>
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
									? 'scale-105 transform bg-green-600 text-white shadow-lg hover:bg-green-700'
									: 'bg-blue-600 hover:bg-blue-700'}"
							>
								{#if isCopying}
									<FontAwesomeIcon icon={faSpinner} spin class="mr-2" />
									복사 중...
								{:else if copySuccess}
									<FontAwesomeIcon icon={faCheck} class="mr-2" />
									복사됨!
								{:else}
									<FontAwesomeIcon icon={faCopy} class="mr-2" />
									복사
								{/if}
							</Button>
							<Button size="sm" variant="outline" onclick={openUrlSameTab}>
								<FontAwesomeIcon icon={faArrowRight} class="mr-2" />
								이동하기
							</Button>
							<Button size="sm" variant="outline" onclick={openUrl}>
								<FontAwesomeIcon icon={faExternalLinkAlt} class="mr-2" />
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
							<FontAwesomeIcon icon={faInfoCircle} class="text-blue-400" />
							<div class="ml-3">
								<h4 class="text-sm font-medium text-blue-800">다음 단계</h4>
								<div class="mt-2 text-sm text-blue-700">
									<ol class="list-inside list-decimal space-y-1">
										<li>생성된 URL을 브라우저에서 열어보세요.</li>
										<li>로그인 페이지에서 인증을 진행하세요.</li>
										{#if responseType === 'code'}
											<li>리다이렉트된 URL에서 인증 코드를 확인하세요.</li>
											<li>인증 코드를 사용하여 토큰을 요청하세요.</li>
										{:else if responseType.includes('token') || responseType.includes('id_token')}
											<li>리다이렉트된 URL의 Fragment(#)에서 토큰을 확인하세요.</li>
											<li>받은 토큰으로 바로 API에 접근할 수 있습니다.</li>
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
</DashboardLayout>
