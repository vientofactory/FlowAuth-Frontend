<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { OIDCUtils } from '$lib/utils/oidc.util';
	import { CryptoUtils } from '$lib/utils/crypto.util';
	import { useToast } from '$lib';
	import type {
		ImplicitTokenResponse,
		IdTokenPayload,
		DiscoveryDocument,
		UserInfo
	} from '$lib/types/oauth.types';

	let discoveryDocument: DiscoveryDocument | null = $state(null);
	let tokens: ImplicitTokenResponse | null = $state(null);
	let idTokenPayload: IdTokenPayload | null = $state(null);
	let userInfo: UserInfo | null = $state(null);
	let _isLoading = $state(false);

	const toast = useToast();

	// 설정 (실제로는 환경 변수나 설정에서 가져와야 함)
	let OIDC_CONFIG = $state({
		issuer: 'http://localhost:3000', // 백엔드 URL
		clientId: 'your-client-id', // 실제 클라이언트 ID로 교체
		redirectUri: '', // 브라우저에서 초기화됨
		scope: 'openid identify email'
	});

	onMount(async () => {
		// 브라우저 환경에서 redirectUri 설정
		OIDC_CONFIG.redirectUri = `${window.location.origin}/callback`;

		// 저장된 토큰 확인
		tokens = OIDCUtils.getStoredTokens();

		// Discovery 문서 로드
		try {
			discoveryDocument = await OIDCUtils.getDiscoveryDocument(OIDC_CONFIG.issuer);
		} catch {
			toast.error('Discovery 문서를 로드할 수 없습니다.');
		}
	});

	async function startImplicitFlow(responseType: 'id_token' | 'token id_token') {
		if (!discoveryDocument?.authorization_endpoint) {
			toast.error('Authorization endpoint를 찾을 수 없습니다.');
			return;
		}

		// state와 nonce 생성
		const state = CryptoUtils.generateState();
		const nonce = CryptoUtils.generateState();

		// 세션 스토리지에 저장
		sessionStorage.setItem('oidc_state', state);
		sessionStorage.setItem('oidc_nonce', nonce);

		// 인증 URL 생성
		const authUrl = OIDCUtils.buildImplicitAuthorizationUrl(
			discoveryDocument.authorization_endpoint,
			{
				client_id: OIDC_CONFIG.clientId,
				redirect_uri: OIDC_CONFIG.redirectUri,
				response_type: responseType,
				scope: OIDC_CONFIG.scope,
				state,
				nonce
			}
		);

		// 리다이렉트
		window.location.href = authUrl;
	}

	async function validateIdToken() {
		if (!tokens?.id_token) {
			toast.error('ID 토큰이 없습니다.');
			return;
		}

		try {
			const storedNonce = sessionStorage.getItem('oidc_nonce');
			idTokenPayload = await OIDCUtils.validateAndParseIdToken(
				tokens.id_token,
				OIDC_CONFIG.issuer,
				OIDC_CONFIG.clientId,
				storedNonce || undefined
			);

			toast.success('ID 토큰이 유효합니다.');
		} catch (error) {
			toast.error(
				`ID 토큰 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
			);
		}
	}

	async function fetchUserInfo() {
		if (!tokens?.access_token || !discoveryDocument?.userinfo_endpoint) {
			toast.error('액세스 토큰 또는 UserInfo 엔드포인트가 없습니다.');
			return;
		}

		try {
			userInfo = await OIDCUtils.getUserInfo(
				discoveryDocument.userinfo_endpoint,
				tokens.access_token
			);

			toast.success('사용자 정보를 가져왔습니다.');
		} catch (error) {
			toast.error(
				`사용자 정보 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
			);
		}
	}

	function logout() {
		OIDCUtils.clearStoredTokens();
		tokens = null;
		idTokenPayload = null;
		userInfo = null;
		toast.success('로그아웃되었습니다.');
	}
</script>

<div class="oidc-demo">
	<h1>OpenID Connect 데모</h1>

	{#if discoveryDocument}
		<Card title="Discovery 문서">
			<div class="discovery-info">
				<p><strong>Issuer:</strong> {discoveryDocument.issuer}</p>
				<p><strong>Authorization Endpoint:</strong> {discoveryDocument.authorization_endpoint}</p>
				<p><strong>Token Endpoint:</strong> {discoveryDocument.token_endpoint}</p>
				<p><strong>UserInfo Endpoint:</strong> {discoveryDocument.userinfo_endpoint}</p>
				<p><strong>JWKS URI:</strong> {discoveryDocument.jwks_uri}</p>
			</div>
		</Card>
	{/if}

	<Card title="Implicit Flow 테스트">
		<div class="flow-buttons">
			<Button
				variant="primary"
				onclick={() => startImplicitFlow('id_token')}
				disabled={!discoveryDocument}
			>
				ID Token 요청
			</Button>

			<Button
				variant="secondary"
				onclick={() => startImplicitFlow('token id_token')}
				disabled={!discoveryDocument}
			>
				Access Token + ID Token 요청
			</Button>
		</div>
	</Card>

	{#if tokens}
		<Card title="받은 토큰">
			<div class="token-info">
				{#if tokens.access_token}
					<p><strong>Access Token:</strong> {tokens.access_token.substring(0, 50)}...</p>
				{/if}
				{#if tokens.id_token}
					<p><strong>ID Token:</strong> {tokens.id_token.substring(0, 50)}...</p>
				{/if}
				<p><strong>Token Type:</strong> {tokens.token_type}</p>
				{#if tokens.expires_in}
					<p><strong>Expires In:</strong> {tokens.expires_in}초</p>
				{/if}
			</div>

			<div class="token-actions">
				{#if tokens.id_token}
					<Button onclick={validateIdToken} variant="outline">ID 토큰 검증</Button>
				{/if}

				{#if tokens.access_token}
					<Button onclick={fetchUserInfo} variant="outline">사용자 정보 조회</Button>
				{/if}

				<Button onclick={logout} variant="danger">로그아웃</Button>
			</div>
		</Card>
	{/if}

	{#if idTokenPayload}
		<Card title="ID 토큰 페이로드">
			<pre class="json-display">{JSON.stringify(idTokenPayload, null, 2)}</pre>
		</Card>
	{/if}

	{#if userInfo}
		<Card title="사용자 정보">
			<pre class="json-display">{JSON.stringify(userInfo, null, 2)}</pre>
		</Card>
	{/if}
</div>

<style>
	.oidc-demo {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.discovery-info p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.flow-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.token-info p {
		margin: 0.5rem 0;
		font-family: monospace;
		font-size: 0.8rem;
		word-break: break-all;
	}

	.token-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.json-display {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		font-size: 0.8rem;
		overflow-x: auto;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
