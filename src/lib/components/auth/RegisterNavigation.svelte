<script lang="ts">
	interface Props {
		currentStep: number;
		totalSteps: number;
		canGoNext: boolean;
		isLoading: boolean;
		onPrevious: () => void;
		onNext: () => void;
		onSubmit: () => void;
	}

	let { currentStep, totalSteps, canGoNext, isLoading, onPrevious, onNext, onSubmit }: Props =
		$props();

	const isFirstStep = $derived(currentStep === 1);
	const isLastStep = $derived(currentStep === totalSteps);
</script>

<div class="flex items-center justify-between border-t border-gray-200 pt-6">
	<!-- 이전 버튼 -->
	<button
		type="button"
		onclick={onPrevious}
		disabled={isFirstStep || isLoading}
		class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-stone-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
	>
		이전
	</button>

	<!-- 단계 표시 -->
	<div class="text-sm text-gray-500">
		{currentStep} / {totalSteps}
	</div>

	<!-- 다음/완료 버튼 -->
	{#if isLastStep}
		<button
			type="button"
			onclick={onSubmit}
			disabled={!canGoNext || isLoading}
			class="min-w-[80px] rounded-lg border border-transparent bg-stone-600 px-6 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isLoading}
				<div class="flex items-center justify-center">
					<svg
						class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					처리중...
				</div>
			{:else}
				회원가입 완료
			{/if}
		</button>
	{:else}
		<button
			type="button"
			onclick={onNext}
			disabled={!canGoNext || isLoading}
			class="rounded-lg border border-transparent bg-neutral-600 px-6 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-700 focus:ring-2 focus:ring-neutral-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			다음
		</button>
	{/if}
</div>
