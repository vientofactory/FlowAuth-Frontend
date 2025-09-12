<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children: any;
    onclick?: () => void;
    class?: string;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    children,
    onclick,
    class: className = ''
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 cursor-pointer border-none
         {variant === 'primary' ? 'bg-blue-600 text-white px-4 py-2 hover:bg-blue-700' : ''}
         {variant === 'secondary' ? 'bg-gray-600 text-white px-4 py-2 hover:bg-gray-700' : ''}
         {variant === 'outline' ? 'bg-transparent text-gray-900 border border-gray-300 px-4 py-2 hover:bg-gray-50' : ''}
         {size === 'sm' ? 'px-3 py-1 text-sm' : ''}
         {size === 'lg' ? 'px-6 py-3 text-lg' : ''}
         {disabled ? 'opacity-50 cursor-not-allowed' : ''}
         {className}"
>
  {@render children?.()}
</button>

<style>
</style>