<script lang="ts">
	import { Button, ActionButton } from '$lib';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		cancelText?: string;
		confirmText: string;
		confirmIcon: IconDefinition;
		confirmVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
		loading?: boolean;
		loadingText?: string;
		disabled?: boolean;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		justify?: 'start' | 'center' | 'end';
		gap?: 'sm' | 'md' | 'lg';
		class?: string;
		onCancel?: () => void;
		onConfirm: () => void;
	}

	let {
		cancelText = '취소',
		confirmText,
		confirmIcon,
		confirmVariant = 'primary',
		loading = false,
		loadingText,
		disabled = false,
		size = 'md',
		justify = 'end',
		gap = 'md',
		class: className = '',
		onCancel,
		onConfirm
	}: Props = $props();

	const justifyClass = $derived(() => {
		switch (justify) {
			case 'start':
				return 'justify-start';
			case 'center':
				return 'justify-center';
			case 'end':
				return 'justify-end';
			default:
				return 'justify-end';
		}
	});

	const gapClass = $derived(() => {
		switch (gap) {
			case 'sm':
				return 'space-x-2';
			case 'md':
				return 'space-x-3';
			case 'lg':
				return 'space-x-4';
			default:
				return 'space-x-3';
		}
	});

	const finalLoadingText = $derived(loadingText || `${confirmText} 중...`);
</script>

<div class="flex {justifyClass} {gapClass} px-6 py-4 {className}">
	{#if onCancel}
		<Button variant="outline" {size} onclick={onCancel} disabled={disabled || loading}>
			{cancelText}
		</Button>
	{/if}
	<ActionButton
		{loading}
		loadingText={finalLoadingText}
		defaultText={confirmText}
		defaultIcon={confirmIcon}
		variant={confirmVariant}
		{size}
		{disabled}
		onclick={onConfirm}
	/>
</div>

<div class="flex {justifyClass} {gapClass} px-6 py-4 {className}">
	{#if onCancel}
		<Button variant="outline" {size} onclick={onCancel} disabled={disabled || loading}>
			{cancelText}
		</Button>
	{/if}
	<ActionButton
		{loading}
		loadingText={finalLoadingText}
		defaultText={confirmText}
		defaultIcon={confirmIcon}
		variant={confirmVariant}
		{size}
		{disabled}
		onclick={onConfirm}
	/>
</div>
