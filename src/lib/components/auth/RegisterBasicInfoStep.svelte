<script lang="ts">
	import { FormField } from '$lib';
	import { USER_TYPES } from '$lib/types/user.types';
	import type { FieldValidation } from '$lib/composables/useFormValidation.svelte';

	interface Props {
		firstNameField: FieldValidation;
		lastNameField: FieldValidation;
		userType: string;
		isLoading: boolean;
		onKeyPress: (event: KeyboardEvent) => void;
	}

	let {
		firstNameField,
		lastNameField,
		userType = $bindable(),
		isLoading,
		onKeyPress
	}: Props = $props();
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<FormField
				label="이름"
				name="firstName"
				type="text"
				placeholder="이름을 입력하세요"
				required
				disabled={isLoading}
				bind:value={firstNameField.value}
				error={firstNameField.error}
				onkeydown={onKeyPress}
			/>

			<FormField
				label="성"
				name="lastName"
				type="text"
				placeholder="성을 입력하세요"
				required
				disabled={isLoading}
				bind:value={lastNameField.value}
				error={lastNameField.error}
				onkeydown={onKeyPress}
			/>
		</div>

		<!-- 사용자 유형 선택 -->
		<fieldset class="space-y-3">
			<legend class="block text-sm font-medium text-gray-700"> 사용자 유형 </legend>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<label
					class="flex cursor-pointer items-start rounded-lg border border-gray-200 p-3 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50"
				>
					<input
						type="radio"
						bind:group={userType}
						value={USER_TYPES.REGULAR}
						class="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
						disabled={isLoading}
					/>
					<div class="ml-3 flex-1">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900">일반 사용자</span>
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
							>
								기본
							</span>
						</div>
						<p class="mt-1 text-xs text-gray-600">OAuth2 인증만 사용</p>
					</div>
				</label>

				<label
					class="flex cursor-pointer items-start rounded-lg border border-gray-200 p-3 transition-colors duration-200 hover:border-green-300 hover:bg-green-50"
				>
					<input
						type="radio"
						bind:group={userType}
						value={USER_TYPES.DEVELOPER}
						class="mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
						disabled={isLoading}
					/>
					<div class="ml-3 flex-1">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900">개발자</span>
							<span
								class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								고급
							</span>
						</div>
						<p class="mt-1 text-xs text-gray-600">클라이언트 및 토큰 관리 기능 포함</p>
					</div>
				</label>
			</div>
			<p class="text-xs text-gray-500">주의: 사용자 유형은 가입 후 변경할 수 없습니다.</p>
		</fieldset>
	</div>
</div>
