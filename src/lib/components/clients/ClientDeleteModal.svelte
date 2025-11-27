<script lang="ts">
	import { Modal, ModalActions } from '$lib';
	import type { Client } from '$lib/types/oauth.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		showDeleteModal: boolean;
		clientToDelete: Client | null;
		isDeleting?: boolean;
		onClose: () => void;
		onConfirmDelete: () => void;
	}

	let {
		showDeleteModal,
		clientToDelete,
		isDeleting = false,
		onClose,
		onConfirmDelete
	}: Props = $props();
</script>

<Modal open={showDeleteModal && !!clientToDelete} title="클라이언트 삭제 확인" {onClose}>
	<div class="space-y-4">
		<div class="flex items-start space-x-3">
			<div class="shrink-0">
				<FontAwesomeIcon icon={faExclamationTriangle} class="text-xl text-red-500" />
			</div>
			<div class="flex-1">
				<h3 class="mb-2 text-lg font-medium text-gray-900">
					정말로 이 클라이언트를 삭제하시겠습니까?
				</h3>
				<p class="mb-4 text-sm text-gray-600">
					이 작업은 되돌릴 수 없습니다. 클라이언트와 관련된 모든 데이터가 영구적으로 삭제됩니다.
				</p>
				<div class="rounded-lg bg-gray-50 p-3">
					<div class="text-sm">
						{#if clientToDelete}
							<p class="font-medium text-gray-900">{clientToDelete.name}</p>
							<p class="mt-1 text-gray-600">Client ID: {clientToDelete.clientId}</p>
						{:else}
							<p class="text-gray-600">클라이언트 정보가 없습니다.</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<ModalActions
			cancelText="취소"
			confirmText="삭제"
			confirmIcon={faTrash}
			confirmVariant="danger"
			loading={isDeleting}
			onCancel={onClose}
			onConfirm={onConfirmDelete}
		/>
	{/snippet}
</Modal>
