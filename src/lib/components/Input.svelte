<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		label?: string;
		id?: string;
		name?: string;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		label?: string;
		id?: string;
		name?: string;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		placeholder = '',
		value = $bindable(),
		disabled = false,
		required = false,
		error = '',
		label = '',
		id = '',
		name = '',
		class: className = '',
		size = 'md',
		oninput,
		onkeydown
	}: Props = $props();

	const sizeClasses = {
		sm: 'h-8 px-2 py-1 text-sm',
		md: 'h-10 px-3 py-2 text-base',
		lg: 'h-11 px-4 py-2 text-base'
	};
</script>

<div class="mb-4">
	{#if label}
		<label for={label} class="mb-2 block text-sm font-medium text-gray-700">{label}</label>
	{/if}

	<input
		{type}
		{placeholder}
		{disabled}
		{required}
		{name}
		id={id || label}
		class="w-full rounded-md border border-gray-300 bg-white transition-all duration-200 focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:outline-none
           {sizeClasses[size]}
           {disabled ? 'cursor-not-allowed bg-gray-50' : ''} 
           {error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
           {className}"
		{value}
		{oninput}
		{onkeydown}
	/>

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>

<style>
</style>
