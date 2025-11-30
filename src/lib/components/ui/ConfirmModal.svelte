<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import ModalActions from '$lib/components/ModalActions.svelte';
	import { faCheck } from '@fortawesome/free-solid-svg-icons';

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
		<ModalActions
			{cancelText}
			{confirmText}
			confirmIcon={faCheck}
			confirmVariant={confirmVariant === 'danger' ? 'danger' : 'primary'}
			{loading}
			{onCancel}
			{onConfirm}
		/>
	{/snippet}
</Modal>
