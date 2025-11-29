<script lang="ts">
	interface LoadingProps {
		variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		text?: string;
		fullscreen?: boolean;
	}

	let {
		variant = 'spinner',
		size = 'md',
		class: className = '',
		text = '',
		fullscreen = false
	}: LoadingProps = $props();

	const sizeClasses = {
		xs: {
			spinner: 'h-3 w-3',
			skeleton: 'h-3',
			text: 'text-xs'
		},
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
		},
		xl: {
			spinner: 'h-12 w-12',
			skeleton: 'h-12',
			text: 'text-xl'
		}
	};
</script>

{#if fullscreen}
	<div class="bg-opacity-75 fixed inset-0 z-80 flex items-center justify-center bg-white">
		<div class="flex flex-col items-center space-y-4">
			{#if variant === 'spinner'}
				<div
					class="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 {sizeClasses[
						size
					].spinner}"
				></div>
			{:else if variant === 'dots'}
				<div class="flex space-x-1">
					<div
						class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"
					></div>
					<div
						class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"
					></div>
					<div class="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
				</div>
			{/if}
			{#if text}
				<p class="text-center text-gray-600 {sizeClasses[size].text}">{text}</p>
			{/if}
		</div>
	</div>
{:else if variant === 'spinner'}
	<div class="flex items-center justify-center space-x-2 {className}">
		<div
			class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 {sizeClasses[size]
				.spinner}"
		></div>
		{#if text}
			<span class="text-gray-600 {sizeClasses[size].text}">{text}</span>
		{/if}
	</div>
{:else if variant === 'dots'}
	<div class="flex items-center justify-center space-x-2 {className}">
		<div class="flex space-x-1">
			<div class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
			<div class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
			<div class="h-2 w-2 animate-bounce rounded-full bg-blue-500"></div>
		</div>
		{#if text}
			<span class="text-gray-600 {sizeClasses[size].text}">{text}</span>
		{/if}
	</div>
{:else if variant === 'skeleton'}
	<div class="animate-pulse space-y-3 {className}">
		<div class="rounded bg-gray-200 {sizeClasses[size].skeleton}"></div>
		<div class="space-y-2">
			<div class="h-3 rounded bg-gray-200"></div>
			<div class="h-3 w-5/6 rounded bg-gray-200"></div>
		</div>
	</div>
{:else if variant === 'pulse'}
	<div class="flex items-center space-x-3 {className}">
		<div class="animate-pulse">
			<div class="rounded-full bg-gray-200 {sizeClasses[size].spinner}"></div>
		</div>
		{#if text}
			<div class="flex-1 animate-pulse">
				<div class="rounded bg-gray-200 {sizeClasses[size].skeleton}"></div>
			</div>
		{/if}
	</div>
{/if}
