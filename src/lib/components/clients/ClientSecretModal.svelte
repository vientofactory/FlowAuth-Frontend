<script lang="ts">
	import { Modal, Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCopy } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		showSecretModal: boolean;
		createdClientSecret: string;
		onClose: () => void;
		onCopyToClipboard: (text: string) => void;
	}

	let { showSecretModal, createdClientSecret, onClose, onCopyToClipboard }: Props = $props();
</script>

<Modal open={showSecretModal} title="클라이언트 생성 완료" {onClose}>
	<div class="space-y-4">
		<p class="text-sm text-gray-600">
			클라이언트가 성공적으로 생성되었습니다. 아래의 클라이언트 시크릿을 안전하게 저장하세요 -
			클라이언트 애플리케이션의 신원을 인증하고 토큰 요청 시 클라이언트의 신뢰성을 검증하는 비밀
			키입니다. <strong>이 시크릿은 다시 확인할 수 없습니다.</strong>
		</p>
		<div>
			<label for="clientSecret" class="mb-2 block text-sm font-medium text-gray-700"
				>Client Secret</label
			>
			<div class="flex space-x-2">
				<input
					id="clientSecret"
					type="text"
					value={createdClientSecret}
					readonly
					class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
				/>
				<Button onclick={() => onCopyToClipboard(createdClientSecret)} variant="outline" size="sm">
					<FontAwesomeIcon icon={faCopy} class="mr-1" />
					복사
				</Button>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<Button onclick={onClose}>확인</Button>
	{/snippet}
</Modal>
