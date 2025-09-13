<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		children: Snippet;
		class?: string;
	}

	let { title, children, class: className = '' }: Props = $props();
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md {className}">
	{#if title}
		<h3 class="m-0 px-6 pt-6 pb-0 text-xl font-semibold text-gray-900">{title}</h3>
	{/if}

	<div class="p-6 {title ? '' : 'pt-6'}">
		{@render children?.()}
	</div>
</div>

<style>
</style>
