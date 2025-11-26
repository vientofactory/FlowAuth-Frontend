<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import LoadingButton from './LoadingButton.svelte';
	import Button from '$lib/components/Button.svelte';

	interface Props {
		open?: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'primary' | 'danger';
		loading?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open = false,
		title,
		message,
		confirmText = '확인',
		cancelText = '취소',
		confirmVariant = 'primary',
		loading = false,
		onConfirm,
		onCancel
	}: Props = $props();
</script>

<Modal {open} {title} onClose={onCancel} size="sm">
	<div class="p-4">
		<p class="text-sm leading-relaxed text-gray-600">{message}</p>
	</div>

	{#snippet footer()}
		<div class="flex justify-end space-x-3 px-6 py-4">
			<Button variant="outline" onclick={onCancel} disabled={loading}>
				{cancelText}
			</Button>
			<LoadingButton
				variant={confirmVariant}
				{loading}
				onclick={onConfirm}
				loadingText="처리 중..."
			>
				{confirmText}
			</LoadingButton>
		</div>
	{/snippet}
</Modal>
