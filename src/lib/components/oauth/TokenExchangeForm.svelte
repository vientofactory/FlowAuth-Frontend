<script lang="ts">
	import { Card, Button, Input, Loading } from '$lib';
	import { createApiUrl } from '$lib/config/env';
	import { useToast } from '$lib';

	interface TokenForm {
		clientId: string;
		clientSecret: string;
		code: string;
		redirectUri: string;
		codeVerifier: string;
		grantType: 'authorization_code';
	}

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface Props {
		authCode: string;
		onTokenExchanged: (tokenResponse: TokenResponse) => void;
	}

	let { authCode, onTokenExchanged }: Props = $props();

	const toast = useToast();

	// 토큰 교환 폼
	let tokenForm = $state<TokenForm>({
		clientId: '',
		clientSecret: '',
		code: authCode,
		redirectUri: '',
		codeVerifier: '',
		grantType: 'authorization_code'
	});

	let isExchanging = $state(false);

	// 컴포넌트 마운트 시 초기화
	$effect(() => {
		// 현재 URL에서 redirect_uri 추출 (콜백 URL)
		tokenForm.redirectUri = window.location.origin + window.location.pathname;

		// 폼에 코드 설정 (Authorization Code Grant)
		if (authCode) {
			tokenForm.code = authCode;
		}

		// 세션 스토리지에서 code_verifier 가져오기
		const storedCodeVerifier = sessionStorage.getItem('code_verifier');
		if (storedCodeVerifier) {
			tokenForm.codeVerifier = storedCodeVerifier;
		}
	});

	// 토큰 교환 함수
	async function exchangeToken() {
		if (!tokenForm.clientId || !tokenForm.clientSecret || !tokenForm.code) {
			toast.error('클라이언트 ID, 시크릿, 인증 코드를 모두 입력해주세요.');
			return;
		}

		isExchanging = true;

		try {
			const tokenEndpoint = createApiUrl('/oauth2/token');

			const params = new URLSearchParams();
			params.append('grant_type', tokenForm.grantType);
			params.append('client_id', tokenForm.clientId);
			params.append('client_secret', tokenForm.clientSecret);
			params.append('code', tokenForm.code);
			params.append('redirect_uri', tokenForm.redirectUri);

			if (tokenForm.codeVerifier) {
				params.append('code_verifier', tokenForm.codeVerifier);
			}

			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: params.toString()
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.error_description || errorData.error || `HTTP ${response.status}`
				);
			}

			const data = await response.json();

			// 토큰 교환 성공 이벤트 발생
			onTokenExchanged(data);

			toast.success('토큰 교환이 성공했습니다!');

			// code_verifier 정리
			sessionStorage.removeItem('code_verifier');
			sessionStorage.removeItem('state');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : '토큰 교환에 실패했습니다.';
			toast.error(errorMessage);
		} finally {
			isExchanging = false;
		}
	}
</script>

<Card class="mb-6">
	<div class="border-b border-gray-200 px-6 py-4">
		<h3 class="flex items-center text-lg font-semibold text-gray-900">
			<i class="fas fa-exchange-alt mr-2 text-blue-600"></i>
			토큰 교환 (Authorization Code Grant)
		</h3>
		<p class="mt-1 text-sm text-gray-600">인증 코드를 액세스 토큰으로 교환합니다.</p>
	</div>

	<div class="space-y-4 p-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="클라이언트 ID"
				placeholder="your-client-id"
				bind:value={tokenForm.clientId}
				required
			/>

			<Input
				label="클라이언트 시크릿"
				type="password"
				placeholder="your-client-secret"
				bind:value={tokenForm.clientSecret}
				required
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="인증 코드"
				placeholder="authorization-code"
				bind:value={tokenForm.code}
				required
			/>

			<Input
				label="리다이렉트 URI"
				placeholder="https://example.com/callback"
				bind:value={tokenForm.redirectUri}
				required
			/>
		</div>

		<Input
			label="코드 검증자 (PKCE)"
			placeholder="code-verifier"
			bind:value={tokenForm.codeVerifier}
		/>

		<div class="flex justify-end">
			<Button variant="primary" onclick={exchangeToken} disabled={isExchanging}>
				{#if isExchanging}
					<Loading size="sm" class="mr-2" />
					교환 중...
				{:else}
					<i class="fas fa-exchange-alt mr-2"></i>
					토큰 교환
				{/if}
			</Button>
		</div>
	</div>
</Card>
