<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { isRetryableError } from '$lib/utils/error.utils';
	import type { AuthorizationError } from '$lib/types/authorization.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faExclamationTriangle, faRedo, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

	export let error: AuthorizationError;
	export let onRetry: (() => void) | null = null;
	export let onGoBack: (() => void) | null = null;
</script>

<div
	class="flex flex-col items-center justify-center space-y-4 p-6"
	role="alert"
	aria-live="assertive"
>
	<div
		class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-r from-red-500 to-pink-600 shadow-lg"
	>
		<FontAwesomeIcon icon={faExclamationTriangle} class="text-2xl text-white" />
	</div>

	<div class="space-y-2 text-center">
		<h2 class="text-lg font-semibold text-gray-900">인가 오류</h2>
		<p class="max-w-md text-sm leading-relaxed text-gray-600">{error.message}</p>

		{#if error.details}
			<details class="mt-2 text-xs text-gray-500">
				<summary class="cursor-pointer hover:text-gray-700">상세 정보</summary>
				<p class="mt-1 rounded bg-gray-50 p-2 text-left">{error.details}</p>
			</details>
		{/if}
	</div>

	<div class="flex space-x-3">
		{#if isRetryableError(error) && onRetry}
			<Button variant="primary" onclick={onRetry} class="px-4 py-2 text-sm">
				<FontAwesomeIcon icon={faRedo} class="mr-2" />
				다시 시도
			</Button>
		{/if}

		<Button
			variant="secondary"
			onclick={onGoBack || (() => window.history.back())}
			class="px-4 py-2 text-sm"
		>
			<FontAwesomeIcon icon={faArrowLeft} class="mr-2" />
			뒤로 가기
		</Button>
	</div>
</div>
