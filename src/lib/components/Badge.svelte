<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BadgeProps {
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		rounded?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		size = 'md',
		rounded = true,
		class: className = '',
		children
	}: BadgeProps = $props();

	const variantClasses = {
		default: 'bg-gray-100 text-gray-800',
		success: 'bg-neutral-100 text-neutral-800',
		warning: 'bg-yellow-100 text-yellow-800',
		error: 'bg-red-100 text-red-800',
		info: 'bg-stone-100 text-stone-800',
		secondary: 'bg-slate-100 text-slate-800'
	};

	const sizeClasses = {
		xs: 'px-1.5 py-0.5 text-xs',
		sm: 'px-2 py-0.5 text-xs sm:text-sm',
		md: 'px-2.5 py-0.5 text-sm',
		lg: 'px-3 py-1 text-sm sm:text-base'
	};

	const roundedClass = rounded ? 'rounded-full' : 'rounded';
</script>

<span
	class={`
		inline-flex items-center font-medium
		${variantClasses[variant]}
		${sizeClasses[size]}
		${roundedClass}
		${className}
	`}
>
	{#if children}
		{@render children()}
	{/if}
</span>
