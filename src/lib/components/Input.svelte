<script lang="ts">
  interface Props {
    type?: 'text' | 'email' | 'password' | 'number';
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    label?: string;
    oninput?: (e: Event) => void;
  }

  let { type = 'text', placeholder = '', disabled = false, required = false, error = '', label = '', oninput }: Props = $props();
  let value = $state('');

  // 외부에서 value를 제어할 수 있도록
  $effect(() => {
    // value prop이 변경되면 내부 state 업데이트
  });
</script>

<div class="mb-4">
  {#if label}
    <label for={label} class="block text-sm font-medium text-gray-700 mb-2">{label}</label>
  {/if}

  <input
    {type}
    {placeholder}
    {disabled}
    {required}
    id={label}
    class="w-full px-3 py-2 border border-gray-300 rounded-md text-base transition-all duration-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
           {disabled ? 'bg-gray-50 cursor-not-allowed' : ''}"
    {value}
    {oninput}
  />

  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<style>
</style>