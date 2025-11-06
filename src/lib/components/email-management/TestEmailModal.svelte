<script lang="ts">
	import { Modal } from '$lib';
	import TestEmailForm from './TestEmailForm.svelte';

	interface TestEmailRequest {
		to: string;
		templateName: string;
		username: string;
	}

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onSubmit: (form: TestEmailRequest) => Promise<void>;
		isProcessing: boolean;
	}

	let { isOpen, onClose, onSubmit, isProcessing }: Props = $props();

	let testEmailForm: TestEmailRequest = $state({
		to: '',
		templateName: 'welcome',
		username: ''
	});

	async function handleSubmit(form: TestEmailRequest) {
		await onSubmit(form);
		// 성공 시 폼 리셋
		testEmailForm = {
			to: '',
			templateName: 'welcome',
			username: ''
		};
		onClose();
	}
</script>

<Modal open={isOpen} {onClose} title="테스트 이메일 전송">
	<TestEmailForm {testEmailForm} {isProcessing} onSubmit={handleSubmit} {onClose} />
</Modal>
