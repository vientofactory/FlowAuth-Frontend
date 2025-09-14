<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		children: Snippet;
		onclick?: () => void;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		children,
		onclick,
		class: className = ''
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex cursor-pointer items-center justify-center rounded-md border-none font-medium transition-all duration-200
         {variant === 'primary' ? 'bg-blue-600 px-4 py-2 text-white hover:bg-blue-700' : ''}
         {variant === 'secondary' ? 'bg-gray-600 px-4 py-2 text-white hover:bg-gray-700' : ''}
         {variant === 'outline'
		? 'border border-gray-300 bg-transparent px-4 py-2 text-gray-900 hover:bg-gray-50'
		: ''}
         {size === 'sm' ? 'px-3 py-1 text-sm' : ''}
         {size === 'lg' ? 'px-6 py-3 text-lg' : ''}
         {disabled ? 'cursor-not-allowed opacity-50' : ''}
         {className}"
>
	{@render children?.()}
</button>

<style>
</style>
