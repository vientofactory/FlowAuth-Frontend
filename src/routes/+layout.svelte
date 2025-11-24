<script lang="ts">
	import '../app.css';
	import 'nprogress/nprogress.css';
	import NProgress from 'nprogress';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.ico';
	import { ToastContainer, apiClient } from '$lib';
	import { authStore } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';

	let { children } = $props();

	NProgress.configure({
		minimum: 0.16
	});

	onMount(async () => {
		console.log('App: Starting initialization...');

		// NProgress navigation 이벤트 설정
		beforeNavigate(() => NProgress.start());
		afterNavigate(() => NProgress.done());

		try {
			// 인증 상태 초기화 (세션 복원)
			await authStore.initialize();
			console.log('App: Auth initialization completed');
		} catch (error) {
			console.error('App: Auth initialization failed:', error);
		}

		// 네트워크 모니터링 시작
		apiClient.startNetworkMonitoring();
		console.log('App: Network monitoring started');
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
