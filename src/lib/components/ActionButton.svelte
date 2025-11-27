<script lang="ts">
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSpinner } from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		loading: boolean;
		loadingText: string;
		defaultText: string;
		defaultIcon: IconDefinition;
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		disabled?: boolean;
		class?: string;
		onclick?: () => void;
		type?: 'button' | 'submit' | 'reset';
	}

	let {
		loading,
		loadingText,
		defaultText,
		defaultIcon,
		variant = 'primary',
		size = 'md',
		disabled = false,
		class: className = '',
		onclick,
		type = 'button'
	}: Props = $props();
</script>

<Button {variant} {size} {type} {onclick} disabled={disabled || loading} class={className}>
	{#if loading}
		<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
		{loadingText}
	{:else}
		<FontAwesomeIcon icon={defaultIcon} class="mr-2" />
		{defaultText}
	{/if}
</Button>
