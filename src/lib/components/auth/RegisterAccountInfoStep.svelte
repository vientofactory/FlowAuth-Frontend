<script lang="ts">
	import { FormField } from '$lib';
	import type { FieldValidation } from '$lib/composables/useFormValidation.svelte';

	interface Props {
		usernameField: FieldValidation;
		emailField: FieldValidation;
		isLoading: boolean;
		onKeyPress: (event: KeyboardEvent) => void;
	}

	let { usernameField, emailField, isLoading, onKeyPress }: Props = $props();
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<FormField
			label="사용자명"
			name="username"
			type="text"
			placeholder="사용자명을 입력하세요"
			required
			disabled={isLoading}
			bind:value={usernameField.value}
			error={usernameField.error}
			hint="사용자명은 3자 이상, 영문/숫자/언더스코어만 사용 가능합니다"
			onkeydown={onKeyPress}
		/>

		<FormField
			label="이메일"
			name="email"
			type="email"
			placeholder="이메일을 입력하세요"
			required
			disabled={isLoading}
			bind:value={emailField.value}
			error={emailField.error}
			onkeydown={onKeyPress}
		/>
	</div>
</div>