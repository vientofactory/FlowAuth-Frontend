<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore, ToastContainer } from '$lib';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		// 앱 시작 시 인증 상태 초기화
		await authStore.initialize();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- 전역 토스트 컨테이너 -->
<ToastContainer />
