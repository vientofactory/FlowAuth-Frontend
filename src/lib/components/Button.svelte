<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		children: Snippet;
		onclick?: () => void;
		class?: string;
		fullWidth?: boolean;
		'aria-label'?: string;
		title?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		children,
		onclick,
		class: className = '',
		fullWidth = false,
		'aria-label': ariaLabel,
		title
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	{onclick}
	aria-label={ariaLabel}
	{title}
	class="inline-flex cursor-pointer items-center justify-center rounded-md border-none font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none
         {variant === 'primary'
		? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
		: ''}
         {variant === 'secondary'
		? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
		: ''}
         {variant === 'outline'
		? 'border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 focus:ring-blue-500'
		: ''}
         {variant === 'ghost'
		? 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
		: ''}
         {variant === 'success'
		? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
		: ''}
         {variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : ''}
         
         {size === 'xs' ? 'h-7 px-2 py-1 text-xs' : ''}
         {size === 'sm' ? 'h-8 px-3 py-1 text-sm' : ''}
         {size === 'md' ? 'h-10 px-4 py-2 text-sm' : ''}
         {size === 'lg' ? 'h-11 px-6 py-2 text-base' : ''}
         {size === 'xl' ? 'h-12 px-8 py-3 text-lg' : ''}
         
         {fullWidth ? 'w-full' : ''}
         {disabled ? 'cursor-not-allowed opacity-50' : ''}
         {className}"
>
	{@render children?.()}
</button>

<style>
</style>
