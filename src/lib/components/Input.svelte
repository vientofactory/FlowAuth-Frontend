<script lang="ts">
	interface Props {
		type?: 'text' | 'email' | 'password' | 'number';
		placeholder?: string;
		value?: string;
		disabled?: boolean;
		required?: boolean;
		error?: string;
		label?: string;
		id?: string;
		name?: string;
		class?: string;
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		type = 'text',
		placeholder = '',
		value = '',
		disabled = false,
		required = false,
		error = '',
		label = '',
		id = '',
		name = '',
		class: className = '',
		oninput,
		onkeydown
	}: Props = $props();

	// 외부에서 value를 제어할 수 있도록
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
		class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none
           {disabled ? 'cursor-not-allowed bg-gray-50' : ''} {className}"
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
