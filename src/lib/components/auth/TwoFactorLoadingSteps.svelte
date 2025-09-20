<script lang="ts">
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	interface LoadingStep {
		icon: string;
		text: string;
		active: boolean;
	}

	interface Props {
		currentStep: number;
		steps: LoadingStep[];
		title?: string;
	}

	let {
		currentStep,
		steps,
		title = '보안 설정을 준비하고 있습니다...'
	}: Props = $props();
</script>

<div class="flex flex-col items-center justify-center space-y-6 p-8">
	<div class="text-center">
		<div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
			<i class="fas fa-shield-alt text-2xl text-blue-600"></i>
		</div>
		<h2 class="mb-2 text-lg font-semibold text-gray-900">2FA 설정 준비</h2>
		<p class="text-sm text-gray-600">{title}</p>
	</div>

	<div class="w-full max-w-md space-y-4">
		{#each steps as step, index (index)}
			<div
				class="flex items-center space-x-3 rounded-lg p-3 transition-all duration-300
				       {step.active ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
				       {currentStep > index ? 'bg-green-50 border border-green-200' : ''}"
			>
				<div class="flex-shrink-0">
					{#if currentStep > index}
						<!-- 완료 상태 -->
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
							<i class="fas fa-check text-sm text-green-600"></i>
						</div>
					{:else if step.active && currentStep === index}
						<!-- 진행 중 상태 -->
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<LoadingSpinner size="sm" />
						</div>
					{:else}
						<!-- 대기 상태 -->
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<span class="text-lg">{step.icon}</span>
						</div>
					{/if}
				</div>

				<div class="flex-1">
					<p
						class="text-sm font-medium transition-colors
						       {currentStep > index ? 'text-green-700' : ''}
						       {step.active ? 'text-blue-700' : 'text-gray-700'}"
					>
						{step.text}
					</p>
					{#if step.active && currentStep === index}
						<div class="mt-1 h-1 w-full rounded-full bg-blue-200">
							<div class="h-1 w-2/3 animate-pulse rounded-full bg-blue-500"></div>
						</div>
					{/if}
				</div>

				{#if currentStep > index}
					<div class="flex-shrink-0">
						<i class="fas fa-check-circle text-green-500"></i>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>