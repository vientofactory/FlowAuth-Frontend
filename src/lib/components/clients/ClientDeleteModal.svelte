<script lang="ts">
	import { Modal, Button } from '$lib';
	import type { Client } from '$lib/types/oauth.types';

	interface Props {
		showDeleteModal: boolean;
		clientToDelete: Client | null;
		onClose: () => void;
		onConfirmDelete: () => void;
	}

	let { showDeleteModal, clientToDelete, onClose, onConfirmDelete }: Props = $props();
</script>

{#if showDeleteModal && clientToDelete}
	<Modal open={showDeleteModal} title="클라이언트 삭제 확인" onClose={onClose}>
		{#snippet children()}
			<div class="space-y-4">
				<div class="flex items-start space-x-3">
					<div class="flex-shrink-0">
						<i class="fas fa-exclamation-triangle text-red-500 text-xl"></i>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-medium text-gray-900 mb-2">
							정말로 이 클라이언트를 삭제하시겠습니까?
						</h3>
						<p class="text-sm text-gray-600 mb-4">
							이 작업은 되돌릴 수 없습니다. 클라이언트와 관련된 모든 데이터가 영구적으로 삭제됩니다.
						</p>
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="text-sm">
								{#if clientToDelete}
									<p class="font-medium text-gray-900">{clientToDelete.name}</p>
									<p class="text-gray-600 mt-1">Client ID: {clientToDelete.clientId}</p>
								{:else}
									<p class="text-gray-600">클라이언트 정보가 없습니다.</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						onclick={onClose}
						class="h-10 w-full sm:h-11 sm:w-auto"
					>
						취소
					</Button>
					<Button
						onclick={onConfirmDelete}
						class="h-10 w-full sm:h-11 sm:w-auto bg-red-600 hover:bg-red-700 text-white"
					>
						<i class="fas fa-trash mr-2"></i>
						삭제
					</Button>
				</div>
			</div>
		{/snippet}
	</Modal>
{/if}