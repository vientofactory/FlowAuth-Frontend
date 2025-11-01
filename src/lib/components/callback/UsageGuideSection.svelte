<script lang="ts">
	import { Card } from '$lib';

	interface Props {
		responseType: string;
		implicitTokens: { access_token?: string; id_token?: string } | null;
		authCode?: string;
	}

	let { responseType, implicitTokens, authCode: _authCode }: Props = $props();
</script>

<Card class="p-6">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">사용 안내</h3>
	<div class="space-y-4 text-sm text-gray-600">
		{#if responseType === 'code id_token'}
			<div>
				<h4 class="font-medium text-gray-900">1. ID 토큰 확인</h4>
				<p>Hybrid Flow로 받은 ID 토큰을 먼저 확인하세요.</p>
			</div>
			<div>
				<h4 class="font-medium text-gray-900">2. 인증 코드 교환</h4>
				<p>인증 코드를 액세스 토큰으로 교환하여 추가 권한을 얻으세요.</p>
			</div>
			<div>
				<h4 class="font-medium text-gray-900">3. 서버측 리소스 접근</h4>
				<p>교환된 액세스 토큰으로 서버측 API에 접근하여 테스트할 수 있습니다.</p>
			</div>
		{:else if responseType === 'code'}
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
		{:else if implicitTokens}
			<div>
				<h4 class="font-medium text-gray-900">1. 토큰 직접 수신</h4>
				<p>Implicit Grant 방식으로 토큰을 URL Fragment를 통해 직접 받았습니다.</p>
			</div>
			<div>
				<h4 class="font-medium text-gray-900">2. 토큰 사용</h4>
				<p>받은 액세스 토큰으로 바로 API에 접근할 수 있습니다.</p>
			</div>
			<div>
				<h4 class="font-medium text-gray-900">3. 보안 주의사항</h4>
				<p>Implicit Grant는 토큰이 브라우저에 노출되므로 보안에 주의하세요.</p>
			</div>
		{:else}
			<div>
				<h4 class="font-medium text-gray-900">지원하는 Response Types</h4>
				<p><strong>code</strong>: Authorization Code Grant (권장)</p>
				<p><strong>token</strong>: Implicit Grant (액세스 토큰만)</p>
				<p><strong>id_token</strong>: OpenID Connect Implicit (ID 토큰만)</p>
				<p><strong>token id_token</strong>: Implicit Grant (액세스 토큰 + ID 토큰)</p>
				<p><strong>code id_token</strong>: Hybrid Flow</p>
			</div>
		{/if}
	</div>
</Card>
