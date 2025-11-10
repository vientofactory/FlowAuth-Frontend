<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { apiClient } from '$lib/utils/api';

	export let src: string = '';
	export let alt: string = 'Logo';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let fallbackSrc: string = '/logo_icon.png';
	export let fallbackIcon: string = 'fa-cube';
	export let useIconFallback: boolean = false;
	export let clickable: boolean = false;
	export let className: string = '';

	const dispatch = createEventDispatcher();

	let imgElement: HTMLImageElement;
	let _hasError = false;
	let _shouldShowIcon = false;

	// Size classes
	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-12 h-12',
		lg: 'w-16 h-16',
		xl: 'w-24 h-24'
	};

	// Icon size classes
	const iconSizeClasses = {
		sm: 'text-lg',
		md: 'text-2xl',
		lg: 'text-3xl',
		xl: 'text-4xl'
	};

	// Load logo from backend (only for internal logo loading)
	async function loadLogo() {
		try {
			if (!src) {
				// Try to get current logo from backend
				const data = await apiClient.uploads.getCurrentLogo();
				src = data.url;
			}
		} catch (error) {
			console.warn('Failed to load logo:', error);
			if (!useIconFallback) {
				src = fallbackSrc;
			}
			_hasError = true;
		}
	}

	function handleError() {
		_hasError = true;
		if (useIconFallback) {
			_shouldShowIcon = true;
		} else if (src !== fallbackSrc) {
			src = fallbackSrc;
		}
	}

	$: {
		if (useIconFallback) {
			_shouldShowIcon =
				!src || src.trim() === '' || src === 'null' || src === 'undefined' || _hasError;
		} else {
			_shouldShowIcon = false;
		}
	}

	function handleClick() {
		if (clickable) {
			dispatch('click');
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (clickable && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			dispatch('click');
		}
	}

	onMount(() => {
		if (!src && !useIconFallback) {
			loadLogo();
		}
	});
</script>

{#if _shouldShowIcon}
	{#if clickable}
		<button
			class="{sizeClasses[
				size
			]} {className} flex items-center justify-center rounded-full bg-linear-to-br from-stone-100 to-gray-200 text-gray-600 shadow-sm transition-all hover:from-stone-200 hover:to-gray-300"
			on:click={handleClick}
			on:keydown={handleKeyDown}
			aria-label={alt}
		>
			<i class="fas {fallbackIcon} {iconSizeClasses[size]}"></i>
		</button>
	{:else}
		<div
			class="{sizeClasses[
				size
			]} {className} flex items-center justify-center rounded-full bg-linear-to-br from-stone-100 to-gray-200 text-gray-600 shadow-sm"
			aria-label={alt}
		>
			<i class="fas {fallbackIcon} {iconSizeClasses[size]}"></i>
		</div>
	{/if}
{:else}
	{#if clickable}
		<button
			class="{sizeClasses[size]} {className}"
			on:click={handleClick}
			on:keydown={handleKeyDown}
			aria-label={alt}
		>
			<img
				bind:this={imgElement}
				{src}
				{alt}
				class="h-full w-full object-contain"
				on:error={handleError}
				loading="lazy"
			/>
		</button>
	{:else}
		<img
			bind:this={imgElement}
			{src}
			{alt}
			class="{sizeClasses[size]} object-contain {className}"
			on:error={handleError}
			loading="lazy"
		/>
	{/if}
{/if}

<style>
	img {
		transition: opacity 0.3s ease;
	}

	button:hover img {
		opacity: 0.8;
	}
</style>
