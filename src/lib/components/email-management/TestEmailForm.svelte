<script lang="ts">
	import { LoadingSpinner } from '$lib';

	interface TestEmailRequest {
		to: string;
		templateName: string;
		username: string;
	}

	interface Props {
		testEmailForm: TestEmailRequest;
		isProcessing: boolean;
		onSubmit: (form: TestEmailRequest) => void;
		onClose: () => void;
	}

	let { testEmailForm, isProcessing, onSubmit, onClose }: Props = $props();

	// 사용 가능한 이메일 템플릿
	const emailTemplates = [
		{ value: 'welcome', label: '환영 이메일' },
		{ value: 'email-verification', label: '이메일 인증' },
		{ value: 'password-reset', label: '비밀번호 재설정' },
		{ value: '2fa-enabled', label: '2FA 활성화' },
		{ value: 'client-created', label: '클라이언트 생성' },
		{ value: 'security-alert', label: '보안 알림' }
	] as const;

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit(testEmailForm);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label for="test-email-to" class="mb-1 block text-sm font-medium text-gray-700">
			받는 이메일 주소
		</label>
		<input
			id="test-email-to"
			type="email"
			bind:value={testEmailForm.to}
			placeholder="test@example.com"
			required
			class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
		/>
	</div>

	<div>
		<label for="test-email-username" class="mb-1 block text-sm font-medium text-gray-700">
			사용자명
		</label>
		<input
			id="test-email-username"
			type="text"
			bind:value={testEmailForm.username}
			placeholder="testuser"
			required
			class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
		/>
	</div>

	<div>
		<label for="test-email-template" class="mb-1 block text-sm font-medium text-gray-700">
			이메일 템플릿
		</label>
		<select
			id="test-email-template"
			bind:value={testEmailForm.templateName}
			class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
		>
			{#each emailTemplates as template (template.value)}
				<option value={template.value}>{template.label}</option>
			{/each}
		</select>
	</div>

	<div class="flex justify-end gap-3 pt-4">
		<button
			type="button"
			onclick={onClose}
			class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
		>
			취소
		</button>
		<button
			type="submit"
			disabled={isProcessing}
			class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
		>
			{#if isProcessing}
				<LoadingSpinner size="sm" />
			{:else}
				<i class="fas fa-paper-plane"></i>
			{/if}
			전송
		</button>
	</div>
</form>
