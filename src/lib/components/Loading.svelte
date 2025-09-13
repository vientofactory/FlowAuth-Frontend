<script lang="ts">
	interface LoadingProps {
		variant?: 'spinner' | 'skeleton' | 'pulse';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		text?: string;
	}

	let {
		variant = 'spinner',
		size = 'md',
		class: className = '',
		text = ''
	}: LoadingProps = $props();

	const sizeClasses = {
		sm: {
			spinner: 'h-4 w-4',
			skeleton: 'h-4',
			text: 'text-sm'
		},
		md: {
			spinner: 'h-6 w-6',
			skeleton: 'h-6',
			text: 'text-base'
		},
		lg: {
			spinner: 'h-8 w-8',
			skeleton: 'h-8',
			text: 'text-lg'
		}
	};
</script>

{#if variant === 'spinner'}
	<div class="flex items-center justify-center space-x-2 {className}">
		<div
			class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 {sizeClasses[
				size
			].spinner}"
		></div>
		{#if text}
			<span class="text-gray-600 {sizeClasses[size].text}">{text}</span>
		{/if}
	</div>
{:else if variant === 'skeleton'}
	<div class="animate-pulse space-y-4 {className}">
		<div class="bg-gray-200 rounded {sizeClasses[size].skeleton}"></div>
		<div class="space-y-2">
			<div class="bg-gray-200 rounded h-4"></div>
			<div class="bg-gray-200 rounded h-4 w-5/6"></div>
		</div>
	</div>
{:else if variant === 'pulse'}
	<div class="flex items-center space-x-4 {className}">
		<div class="animate-pulse">
			<div class="bg-gray-200 rounded-full {sizeClasses[size].spinner}"></div>
		</div>
		{#if text}
			<div class="animate-pulse flex-1">
				<div class="bg-gray-200 rounded {sizeClasses[size].skeleton}"></div>
			</div>
		{/if}
	</div>
{/if}