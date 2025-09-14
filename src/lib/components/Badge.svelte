<script lang="ts">
	interface BadgeProps {
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
		size?: 'sm' | 'md' | 'lg';
		rounded?: boolean;
		class?: string;
		children?: any;
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
		success: 'bg-green-100 text-green-800',
		warning: 'bg-yellow-100 text-yellow-800',
		error: 'bg-red-100 text-red-800',
		info: 'bg-blue-100 text-blue-800',
		secondary: 'bg-purple-100 text-purple-800'
	};

	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-2.5 py-0.5 text-sm',
		lg: 'px-3 py-1 text-base'
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
