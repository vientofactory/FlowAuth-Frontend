<script lang="ts">
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { apiClient } from '$lib/utils/api';

	export let src: string = '';
	export let alt: string = 'Logo';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let fallbackSrc: string = '/logo_icon.png';
	export let clickable: boolean = false;
	export let className: string = '';

	const dispatch = createEventDispatcher();

	let imgElement: HTMLImageElement;
	let _hasError = false;

	// Size classes
	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-12 h-12',
		lg: 'w-16 h-16',
		xl: 'w-24 h-24'
	};

	// Load logo from backend
	async function loadLogo() {
		try {
			if (!src) {
				// Try to get current logo from backend
				const data = await apiClient.uploads.getCurrentLogo();
				src = data.url;
			}
		} catch (error) {
			console.warn('Failed to load logo:', error);
			src = fallbackSrc;
			_hasError = true;
		}
	}

	function handleError() {
		_hasError = true;
		if (src !== fallbackSrc) {
			src = fallbackSrc;
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
		loadLogo();
	});
</script>

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

<style>
	img {
		transition: opacity 0.3s ease;
	}

	button:hover img {
		opacity: 0.8;
	}
</style>
