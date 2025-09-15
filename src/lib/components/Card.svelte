<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		children: Snippet;
		class?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
	}

	let { 
		title, 
		children, 
		class: className = '',
		padding = 'md'
	}: Props = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-3 sm:p-4',
		md: 'p-4 sm:p-6',
		lg: 'p-6 sm:p-8'
	};
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md {className}">
	{#if title}
		<div class="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
			<h3 class="m-0 text-lg sm:text-xl font-semibold text-gray-900">{title}</h3>
		</div>
	{/if}

	<div class="{paddingClasses[padding]} {title ? '' : 'pt-4 sm:pt-6'}">
		{@render children?.()}
	</div>
</div>

<style>
</style>
