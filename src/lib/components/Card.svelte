<script lang="ts">
  interface Props {
    title?: string;
    children: any;
    class?: string;
  }

  let { title, children, class: className = '' }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden {className}">
  {#if title}
    <h3 class="m-0 px-6 pt-6 pb-0 text-xl font-semibold text-gray-900">{title}</h3>
  {/if}

  <div class="p-6 {title ? '' : 'pt-6'}">
    {@render children?.()}
  </div>
</div>

<style>
</style>