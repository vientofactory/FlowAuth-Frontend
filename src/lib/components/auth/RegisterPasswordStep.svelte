<script lang="ts">
	import { FormField } from '$lib';
	import type { FieldValidation } from '$lib/composables/useFormValidation.svelte';

	interface Props {
		passwordField: FieldValidation;
		confirmPasswordField: FieldValidation;
		passwordRequirements: {
			length: boolean;
			lowercase: boolean;
			uppercase: boolean;
			number: boolean;
			specialChar: boolean;
		};
		isLoading: boolean;
		onKeyPress: (event: KeyboardEvent) => void;
	}

	let { passwordField, confirmPasswordField, passwordRequirements, isLoading, onKeyPress }: Props = $props();

	function getRequirementStatus(met: boolean) {
		return met ? 'text-green-600' : 'text-gray-500';
	}

	function getRequirementIcon(met: boolean) {
		return met ? '✓' : '○';
	}
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
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-900 mb-3">비밀번호 요구사항</h4>
			<div class="space-y-2 text-sm">
				<div class={getRequirementStatus(passwordRequirements.length)}>
					<span class="inline-block w-4">{getRequirementIcon(passwordRequirements.length)}</span>
					8자 이상
				</div>
				<div class={getRequirementStatus(passwordRequirements.lowercase)}>
					<span class="inline-block w-4">{getRequirementIcon(passwordRequirements.lowercase)}</span>
					소문자 포함
				</div>
				<div class={getRequirementStatus(passwordRequirements.uppercase)}>
					<span class="inline-block w-4">{getRequirementIcon(passwordRequirements.uppercase)}</span>
					대문자 포함
				</div>
				<div class={getRequirementStatus(passwordRequirements.number)}>
					<span class="inline-block w-4">{getRequirementIcon(passwordRequirements.number)}</span>
					숫자 포함
				</div>
				<div class={getRequirementStatus(passwordRequirements.specialChar)}>
					<span class="inline-block w-4">{getRequirementIcon(passwordRequirements.specialChar)}</span>
					특수문자 포함
				</div>
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