<script lang="ts">
	interface Props {
		currentStep: number;
		steps: Array<{ number: number; label: string }>;
	}

	let { currentStep, steps }: Props = $props();
</script>

<div class="mb-8 flex items-center justify-center">
	{#each steps as step, index (step.number)}
		<div class="flex items-center">
			<!-- 단계 원형 -->
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-200
				       {currentStep >= step.number
					? 'border-blue-500 bg-blue-500 text-white'
					: 'border-gray-300 bg-white text-gray-500'}"
			>
				{#if currentStep > step.number}
					<i class="fas fa-check"></i>
				{:else}
					{step.number}
				{/if}
			</div>

			<!-- 단계 라벨 -->
			<div class="ml-3 hidden sm:block">
				<span
					class="text-sm font-medium transition-colors duration-200
					       {currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}"
				>
					{step.label}
				</span>
			</div>

			<!-- 연결선 (마지막 단계가 아닌 경우) -->
			{#if index < steps.length - 1}
				<div
					class="mx-4 h-0.5 w-12 transition-colors duration-200 sm:mx-6 sm:w-16
					       {currentStep > step.number ? 'bg-blue-500' : 'bg-gray-300'}"
				></div>
			{/if}
		</div>
	{/each}
</div>

<!-- 모바일용 단계 라벨 -->
<div class="mb-4 text-center sm:hidden">
	<span class="text-sm font-medium text-blue-600">
		{steps.find((s) => s.number === currentStep)?.label || ''}
	</span>
</div>
