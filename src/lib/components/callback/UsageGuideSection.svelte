<script lang="ts">
	import { Card } from '$lib';

	interface Props {
		responseType: string;
		authCode?: string;
	}

	let { responseType, authCode: _authCode }: Props = $props();
</script>

<Card class="p-6">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">사용 안내</h3>
	<div class="space-y-4 text-sm text-gray-600">
		{#if responseType === 'code'}
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
		{:else}
			<div>
				<h4 class="font-medium text-gray-900">지원하는 Response Types</h4>
				<p><strong>code</strong>: Authorization Code Grant (권장)</p>
			</div>
		{/if}
	</div>
</Card>
