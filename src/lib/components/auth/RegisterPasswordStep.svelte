<script lang="ts">
	import { FormField, getRequirementIcon, getRequirementStatus } from '$lib';
	import type { FieldValidation } from '$lib/composables/useFormValidation.svelte';
	import type { PasswordRequirements } from '$lib';

	interface Props {
		passwordField: FieldValidation;
		confirmPasswordField: FieldValidation;
		passwordRequirements: PasswordRequirements;
		isLoading: boolean;
		onKeyPress: (event: KeyboardEvent) => void;
	}

	let { passwordField, confirmPasswordField, passwordRequirements, isLoading, onKeyPress }: Props =
		$props();

	// 요구사항 목록 정의
	const requirements = [
		{ key: 'length' as const, label: '8자 이상' },
		{ key: 'lowercase' as const, label: '소문자 포함' },
		{ key: 'uppercase' as const, label: '대문자 포함' },
		{ key: 'number' as const, label: '숫자 포함' },
		{ key: 'specialChar' as const, label: '특수문자 포함' }
	] as const;
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<FormField
			label="비밀번호"
			name="password"
			type="password"
			placeholder="비밀번호를 입력하세요"
			required
			disabled={isLoading}
			bind:value={passwordField.value}
			error={passwordField.error}
			onkeydown={onKeyPress}
		/>

		<!-- 비밀번호 요구사항 -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h4 class="mb-3 text-sm font-medium text-gray-900">비밀번호 요구사항</h4>
			<div class="space-y-2 text-sm">
				{#each requirements as { key, label } (key)}
					<div class={getRequirementStatus(passwordRequirements[key])}>
						<span class="inline-block w-4">
							{@html getRequirementIcon(passwordRequirements[key])}
						</span>
						{label}
					</div>
				{/each}
			</div>
		</div>

		<FormField
			label="비밀번호 확인"
			name="confirmPassword"
			type="password"
			placeholder="비밀번호를 다시 입력하세요"
			required
			disabled={isLoading}
			bind:value={confirmPasswordField.value}
			error={confirmPasswordField.error}
			onkeydown={onKeyPress}
		/>
	</div>
</div>
