<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';

	export let message = '로딩 중...';
	export let progress = 0;
</script>

<div
	class="mx-auto flex min-h-[200px] max-w-sm flex-col items-center justify-center p-6"
	role="status"
	aria-live="polite"
>
	<!-- 메시지 영역 -->
	<div class="flex flex-1 flex-col items-center justify-center space-y-4">
		<div class="relative">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r from-stone-500 to-stone-600 shadow-lg"
			>
				<FontAwesomeIcon icon={faShieldAlt} class="animate-pulse text-2xl text-white" />
			</div>
			{#if progress > 0}
				<div class="absolute inset-0 rounded-full border-4 border-gray-200">
					<div
						class="rounded-full border-4 border-stone-500 transition-all duration-300"
						style="border-radius: 50%; width: 100%; height: 100%; border-color: transparent transparent #6b7280 #6b7280; transform: rotate({progress *
							3.6}deg);"
					></div>
				</div>
			{/if}
		</div>

		<div class="space-y-2 text-center">
			<h2 class="text-lg font-semibold text-gray-900">보안 검증 중</h2>
			<div class="flex min-h-6 items-center justify-center">
				<p class="animate-pulse text-sm text-gray-600">{message}</p>
			</div>
		</div>
	</div>

	<!-- 프로그래스바 영역 -->
	{#if progress > 0}
		<div class="min-w-[180px] space-y-2">
			<div class="h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-stone-600 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
			<p class="text-center text-xs text-gray-500">{progress}% 완료</p>
		</div>
	{/if}
</div>
