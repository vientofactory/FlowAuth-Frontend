<script lang="ts">
	import { Card, Button, Input, Loading } from '$lib';
	import { createApiUrl } from '$lib/config/env';
	import { useToast } from '$lib';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface Props {
		clientId: string;
		clientSecret: string;
		code: string;
		redirectUri: string;
		codeVerifier: string;
		authCode: string;
		onTokenExchanged: (tokenResponse: TokenResponse) => void;
		onClientIdChange: (value: string) => void;
		onClientSecretChange: (value: string) => void;
		onCodeChange: (value: string) => void;
		onRedirectUriChange: (value: string) => void;
		onCodeVerifierChange: (value: string) => void;
	}

	let {
		clientId,
		clientSecret,
		code,
		redirectUri,
		codeVerifier,
		authCode,
		onTokenExchanged,
		onClientIdChange,
		onClientSecretChange,
		onCodeChange,
		onRedirectUriChange,
		onCodeVerifierChange
	}: Props = $props();

	const toast = useToast();

	// authCode가 변경되면 code 업데이트
	$effect(() => {
		if (authCode && !code) {
			onCodeChange(authCode);
		}
	});

	let isExchanging = $state(false);

	// 토큰 교환 함수
	async function exchangeToken() {
		// 필수 필드 검증
		const missingFields = [];
		if (!clientId) missingFields.push('클라이언트 ID');
		if (!clientSecret) missingFields.push('클라이언트 시크릿');
		if (!code) missingFields.push('인증 코드');

		if (missingFields.length > 0) {
			const errorMsg = `다음 필드를 입력해주세요: ${missingFields.join(', ')}`;
			toast.error(errorMsg);
			return;
		}

		isExchanging = true;

		try {
			const tokenEndpoint = createApiUrl('/oauth2/token');

			const params = new URLSearchParams();
			params.append('grant_type', 'authorization_code');
			params.append('client_id', clientId);
			params.append('client_secret', clientSecret);
			params.append('code', code);
			params.append('redirect_uri', redirectUri);

			if (codeVerifier) {
				params.append('code_verifier', codeVerifier);
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
				value={clientId}
				oninput={(e) => onClientIdChange((e.target as HTMLInputElement).value)}
				required
			/>

			<Input
				label="클라이언트 시크릿"
				type="password"
				placeholder="your-client-secret"
				value={clientSecret}
				oninput={(e) => onClientSecretChange((e.target as HTMLInputElement).value)}
				required
			/>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Input
				label="인증 코드"
				placeholder="authorization-code"
				value={code}
				oninput={(e) => onCodeChange((e.target as HTMLInputElement).value)}
				required
			/>

			<Input
				label="리다이렉트 URI"
				placeholder="https://example.com/callback"
				value={redirectUri}
				oninput={(e) => onRedirectUriChange((e.target as HTMLInputElement).value)}
				required
			/>
		</div>

		<Input
			label="코드 검증자 (PKCE) - 선택사항"
			placeholder="PKCE를 사용하는 경우에만 입력"
			value={codeVerifier}
			oninput={(e) => onCodeVerifierChange((e.target as HTMLInputElement).value)}
		/>

		<div class="flex justify-end">
			<Button
				variant="primary"
				onclick={exchangeToken}
				disabled={isExchanging || !clientId || !clientSecret || !code}
			>
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
