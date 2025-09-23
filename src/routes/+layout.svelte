<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import { ToastContainer, apiClient } from '$lib';
	import { authStore } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		// 인증 상태 초기화 (세션 복원)
		await authStore.initialize();

		// 네트워크 모니터링 시작
		apiClient.startNetworkMonitoring();
	});

	onDestroy(() => {
		// 앱 종료 시 네트워크 모니터링 중지
		apiClient.stopNetworkMonitoring();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- 전역 토스트 컨테이너 -->
<ToastContainer />
