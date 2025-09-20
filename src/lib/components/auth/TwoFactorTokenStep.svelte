<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormField from '$lib/components/form/FormField.svelte';
	import LoadingButton from '$lib/components/ui/LoadingButton.svelte';
	import { useFieldValidation, validators } from '$lib/composables/useFormValidation.svelte';
	import { inputHandlers } from '$lib/utils/input.utils';

	interface Props {
		loading?: boolean;
		onVerify: (token: string) => void;
		onBack: () => void;
	}

	let { loading = false, onVerify, onBack }: Props = $props();

	const tokenField = useFieldValidation('', validators.twoFactorToken);

	function handleSubmit(event: Event) {
		event.preventDefault();

		if (tokenField.validate()) {
			onVerify(tokenField.value);
		}
	}

	function handleTokenInput(event: Event) {
		inputHandlers.twoFactorToken(tokenField)(event);
	}
</script>

<Card>
	<div class="p-6">
		<div class="text-center">
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
				<i class="fas fa-key text-xl text-green-600"></i>
			</div>
			<h2 class="mb-2 text-xl font-bold text-gray-900">2단계: 토큰 확인</h2>
			<p class="mb-6 text-gray-600">인증 앱에서 생성된 6자리 토큰을 입력하세요.</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="flex justify-center">
				<div class="w-48">
					<FormField
						label="6자리 토큰"
						name="token"
						type="text"
						placeholder="000000"
						bind:value={tokenField.value}
						error={tokenField.error}
						maxlength={6}
						inputmode="numeric"
						class="text-center font-mono text-2xl tracking-widest"
						oninput={handleTokenInput}
						disabled={loading}
						required
					/>
				</div>
			</div>

			<div class="rounded-lg bg-blue-50 p-4">
				<div class="flex items-start">
					<i class="fas fa-info-circle mt-0.5 text-blue-500"></i>
					<div class="ml-3">
						<p class="text-sm text-blue-700">
							<strong>참고:</strong> 토큰은 30초마다 새로 생성됩니다. 시간이 지나면 새로운 토큰을 입력해주세요.
						</p>
					</div>
				</div>
			</div>

			<div class="flex justify-between">
				<Button variant="outline" onclick={onBack} disabled={loading}>
					<i class="fas fa-arrow-left mr-2"></i>
					이전
				</Button>
				<LoadingButton
					type="submit"
					{loading}
					disabled={!tokenField.value || tokenField.value.length !== 6}
					loadingText="확인 중..."
				>
					<i class="fas fa-check mr-2"></i>
					확인
				</LoadingButton>
			</div>
		</form>
	</div>
</Card>
