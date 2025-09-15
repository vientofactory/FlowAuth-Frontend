<script lang="ts">
	import { STYLE_CONSTANTS } from '$lib/constants/app.constants';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="{STYLE_CONSTANTS.BACKGROUND.PAGE} px-4 py-12">
	<!-- 배경 패턴 -->
	<div
		class="bg-grid-slate-100 absolute inset-0 -z-10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"
	></div>

	{@render children?.()}
</div>

<style>
	.bg-grid-slate-100 {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(148 163 184 / 0.1)'%3e%3cpath d='m0 .5h32m-32 32h32m-32-32v32m32-32v32'/%3e%3c/svg%3e");
	}
</style>
