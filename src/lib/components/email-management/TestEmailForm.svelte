<script lang="ts">
	import { Button, ActionButton } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faHandPaper,
		faEnvelopeOpenText,
		faKey,
		faShieldAlt,
		faPlusCircle,
		faExclamationTriangle,
		faEnvelope,
		faUser,
		faFileAlt,
		faChevronDown,
		faPaperPlane
	} from '@fortawesome/free-solid-svg-icons';

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
		{ value: 'welcome', label: '환영 이메일', icon: faHandPaper },
		{ value: 'email-verification', label: '이메일 인증', icon: faEnvelopeOpenText },
		{ value: 'password-reset', label: '비밀번호 재설정', icon: faKey },
		{ value: '2fa-enabled', label: '2FA 활성화', icon: faShieldAlt },
		{ value: 'client-created', label: '클라이언트 생성', icon: faPlusCircle },
		{ value: 'security-alert', label: '보안 알림', icon: faExclamationTriangle }
	] as const;

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit(testEmailForm);
	}

	const selectedTemplate = $derived(
		emailTemplates.find((template) => template.value === testEmailForm.templateName)
	);
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<div class="space-y-4">
		<div>
			<label for="test-email-to" class="mb-2 block text-sm font-medium text-gray-700">
				받는 이메일 주소
			</label>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3">
					<FontAwesomeIcon icon={faEnvelope} class="text-gray-400" />
				</div>
				<input
					id="test-email-to"
					type="email"
					bind:value={testEmailForm.to}
					placeholder="test@example.com"
					required
					class="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 transition-colors focus:border-stone-500 focus:ring-1 focus:ring-stone-500 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="test-email-username" class="mb-2 block text-sm font-medium text-gray-700">
				사용자명
			</label>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3">
					<FontAwesomeIcon icon={faUser} class="text-gray-400" />
				</div>
				<input
					id="test-email-username"
					type="text"
					bind:value={testEmailForm.username}
					placeholder="testuser"
					required
					class="w-full rounded-lg border border-gray-300 py-2.5 pr-3 pl-10 transition-colors focus:border-stone-500 focus:ring-1 focus:ring-stone-500 focus:outline-none"
				/>
			</div>
		</div>

		<div>
			<label for="test-email-template" class="mb-2 block text-sm font-medium text-gray-700">
				이메일 템플릿
			</label>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 flex items-center pl-3">
					{#if selectedTemplate}
						<FontAwesomeIcon icon={selectedTemplate.icon} class="text-gray-400" />
					{:else}
						<FontAwesomeIcon icon={faFileAlt} class="text-gray-400" />
					{/if}
				</div>
				<select
					id="test-email-template"
					bind:value={testEmailForm.templateName}
					class="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-8 pl-10 transition-colors focus:border-stone-500 focus:ring-1 focus:ring-stone-500 focus:outline-none"
				>
					{#each emailTemplates as template (template.value)}
						<option value={template.value}>{template.label}</option>
					{/each}
				</select>
				<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
					<FontAwesomeIcon icon={faChevronDown} class="text-gray-400" />
				</div>
			</div>
		</div>
	</div>

	<!-- 템플릿 미리보기 -->
	{#if selectedTemplate}
		<div class="rounded-lg border border-stone-200 bg-stone-50 p-4">
			<div class="mb-2 flex items-center gap-2">
				<FontAwesomeIcon icon={selectedTemplate.icon} class="text-stone-600" />
				<span class="text-sm font-medium text-stone-700">선택된 템플릿</span>
			</div>
			<p class="text-sm text-stone-600">{selectedTemplate.label}</p>
		</div>
	{/if}

	<div class="flex justify-end gap-3 border-t border-gray-200 pt-6">
		<Button variant="outline" onclick={onClose} disabled={isProcessing}>취소</Button>
		<ActionButton
			loading={isProcessing}
			loadingText="전송 중..."
			defaultText="전송"
			defaultIcon={faPaperPlane}
			variant="primary"
			size="md"
			type="submit"
			class="min-w-[120px] bg-stone-600 hover:bg-stone-700"
		/>
	</div>
</form>
