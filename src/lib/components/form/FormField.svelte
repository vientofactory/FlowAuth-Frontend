<script lang="ts">
	interface Props {
		label: string;
		name: string;
		type?: 'text' | 'email' | 'password' | 'url' | 'tel';
		value: string;
		error?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		hint?: string;
		icon?: string;
		maxlength?: number;
		minlength?: number;
		autocomplete?: string;
		inputmode?: 'text' | 'email' | 'numeric' | 'tel' | 'url';
		class?: string;
		oninput?: (event: Event) => void;
		onkeydown?: (event: KeyboardEvent) => void;
		onblur?: (event: FocusEvent) => void;
		onfocus?: (event: FocusEvent) => void;
	}

	let {
		label,
		name,
		type = 'text',
		value = $bindable(),
		error = '',
		placeholder = '',
		required = false,
		disabled = false,
		hint = '',
		icon = '',
		maxlength,
		minlength,
		autocomplete,
		inputmode,
		class: className = '',
		oninput,
		onkeydown,
		onblur,
		onfocus
	}: Props = $props();

	const inputId = `field-${name}`;
	const hasError = $derived(!!error);
	const showHint = $derived(hint && !hasError);
</script>

<div class="form-field">
	<label for={inputId} class="mb-2 block text-sm font-medium text-gray-700">
		{#if icon}
			<i class="{icon} mr-2 text-blue-500"></i>
		{/if}
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>

	<input
		id={inputId}
		{name}
		{type}
		{placeholder}
		{required}
		{disabled}
		{maxlength}
		{minlength}
		{autocomplete}
		{inputmode}
		bind:value
		{oninput}
		{onkeydown}
		{onblur}
		{onfocus}
		class="w-full rounded-md border px-3 py-2 text-base shadow-sm transition-all duration-200 focus:outline-none focus:ring-2
		       {hasError
			? 'border-red-300 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
		       {disabled ? 'cursor-not-allowed bg-gray-50 opacity-50' : 'bg-white'}
		       {className}"
	/>

	{#if hasError}
		<p class="mt-1 text-sm text-red-600" role="alert">
			<i class="fas fa-exclamation-circle mr-1"></i>
			{error}
		</p>
	{:else if showHint}
		<p class="mt-1 text-xs text-gray-500">{hint}</p>
	{/if}
</div>

<style>
	.form-field {
		position: relative;
	}
</style>