<script lang="ts">
	import { Modal, Button } from '$lib';

	interface TokenData {
		id: number;
		accessToken: string;
		tokenType: string;
		expiresAt: string;
		client?: {
			name: string;
			clientId: string;
		};
		createdAt: string;
	}

	interface Props {
		isOpen: boolean;
		token: TokenData | null;
		isRevoking?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { isOpen, token, isRevoking = false, onConfirm, onCancel }: Props = $props();

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let tokenTypeName = $derived(token?.tokenType === 'login' ? '로그인 토큰' : 'OAuth2 토큰');
</script>

<Modal open={isOpen} onClose={onCancel} size="md">
	{#snippet header()}
		<div class="flex items-center">
			<i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
			<h3 class="text-lg font-semibold text-gray-900">토큰 폐기 확인</h3>
		</div>
	{/snippet}

	{#snippet children()}
		{#if token}
			<div class="space-y-4">
				<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
					<div class="flex">
						<i class="fas fa-exclamation-triangle mt-0.5 mr-2 text-yellow-400"></i>
						<div class="text-sm text-yellow-800">
							<p class="mb-1 font-medium">주의사항</p>
							<p>
								토큰을 폐기하면 해당 토큰을 사용한 모든 인증이 즉시 무효화됩니다. 이 작업은 되돌릴
								수 없습니다.
							</p>
						</div>
					</div>
				</div>

				<div class="rounded-lg bg-gray-50 p-4">
					<h4 class="mb-3 font-medium text-gray-900">폐기할 토큰 정보</h4>
					<dl class="space-y-2 text-sm">
						<div class="flex">
							<dt class="w-20 text-gray-500">유형:</dt>
							<dd class="text-gray-900">{tokenTypeName}</dd>
						</div>
						{#if token.client?.name}
							<div class="flex">
								<dt class="w-20 text-gray-500">클라이언트:</dt>
								<dd class="text-gray-900">{token.client.name}</dd>
							</div>
						{/if}
						<div class="flex">
							<dt class="w-20 text-gray-500">발급일:</dt>
							<dd class="text-gray-900">{formatDate(token.createdAt)}</dd>
						</div>
						<div class="flex">
							<dt class="w-20 text-gray-500">만료일:</dt>
							<dd class="text-gray-900">{formatDate(token.expiresAt)}</dd>
						</div>
					</dl>
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet footer()}
		<Button variant="outline" onclick={onCancel} disabled={isRevoking}>취소</Button>
		<Button variant="danger" onclick={onConfirm} disabled={isRevoking} class="min-w-[80px]">
			{#if isRevoking}
				<i class="fas fa-spinner fa-spin mr-1"></i>
				폐기 중...
			{:else}
				<i class="fas fa-trash mr-1"></i>
				폐기
			{/if}
		</Button>
	{/snippet}
</Modal>
