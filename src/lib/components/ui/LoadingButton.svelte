<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		loadingText?: string;
		icon?: string;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		loadingText = '처리 중...',
		icon = '',
		type = 'button',
		class: className = '',
		onclick,
		children
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
	const spinnerColor = $derived(variant === 'outline' ? 'blue' : 'white');
</script>

<Button
	{variant}
	{size}
	{type}
	disabled={isDisabled}
	class="{className} {loading ? 'cursor-wait' : ''}"
	{onclick}
>
	{#if loading}
		<LoadingSpinner size="sm" color={spinnerColor} class="mr-2" />
		{loadingText}
	{:else}
		{#if icon}
			<i class="{icon} mr-2"></i>
		{/if}
		{#if children}
			{@render children()}
		{/if}
	{/if}
</Button>