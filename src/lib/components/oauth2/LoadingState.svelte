<script lang="ts">
	import Loading from '$lib/components/Loading.svelte';

	export let message = '로딩 중...';
	export let progress = 0;
</script>

<div
	class="flex flex-col items-center justify-center space-y-4 p-6"
	role="status"
	aria-live="polite"
>
	<div class="relative">
		<div
			class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
		>
			<i class="fas fa-shield-alt animate-pulse text-2xl text-white"></i>
		</div>
		{#if progress > 0}
			<div class="absolute inset-0 rounded-full border-4 border-gray-200">
				<div
					class="rounded-full border-4 border-blue-500 transition-all duration-300"
					style="border-radius: 50%; width: 100%; height: 100%; border-color: transparent transparent #3b82f6 #3b82f6; transform: rotate({progress *
						3.6}deg);"
				></div>
			</div>
		{/if}
	</div>

	<div class="space-y-2 text-center">
		<h2 class="text-lg font-semibold text-gray-900">보안 검증 중</h2>
		<Loading />
		<p class="animate-pulse text-sm text-gray-600">{message}</p>
		{#if progress > 0}
			<div class="h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-blue-600 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
			<p class="text-xs text-gray-500">{progress}% 완료</p>
		{/if}
	</div>
</div>
