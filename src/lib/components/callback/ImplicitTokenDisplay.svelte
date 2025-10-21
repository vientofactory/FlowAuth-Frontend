<script lang="ts">
	import { Card, Button } from '$lib';

	interface Props {
		implicitTokens: {
			token_type?: string;
			expires_in?: number;
			scope?: string;
		};
		isTestingToken: boolean;
		onShowTokenModal: () => void;
		onFetchUserProfile: () => void;
	}

	let { implicitTokens, isTestingToken, onShowTokenModal, onFetchUserProfile }: Props = $props();
</script>

<Card class="p-6">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">받은 토큰 정보</h3>
	<div class="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
		<div class="flex items-center">
			<i class="fas fa-info-circle mr-2 text-stone-600"></i>
			<span class="font-medium text-stone-800">Implicit Grant</span>
		</div>
		<p class="mt-1 text-stone-700">
			토큰이 URL Fragment를 통해 직접 전달되었습니다. 토큰 교환 과정이 필요하지 않습니다.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#if implicitTokens.token_type}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">Token Type</div>
				<div class="text-sm text-gray-900">{implicitTokens.token_type}</div>
			</div>
		{/if}

		{#if implicitTokens.expires_in}
			<div>
				<div class="mb-1 text-sm font-medium text-gray-700">Expires In</div>
				<div class="text-sm text-gray-900">{implicitTokens.expires_in}초</div>
			</div>
		{/if}

		{#if implicitTokens.scope}
			<div class="col-span-2">
				<div class="mb-1 text-sm font-medium text-gray-700">Scope</div>
				<div class="text-sm text-gray-900">{implicitTokens.scope}</div>
			</div>
		{/if}
	</div>

	<div class="mt-4 flex space-x-2">
		<Button onclick={onShowTokenModal} variant="primary">
			<i class="fas fa-eye mr-2"></i>
			토큰 상세 보기
		</Button>
		<Button onclick={onFetchUserProfile} disabled={isTestingToken} variant="outline">
			<i class="fas fa-user mr-2"></i>
			프로필 가져오기
		</Button>
	</div>
</Card>
