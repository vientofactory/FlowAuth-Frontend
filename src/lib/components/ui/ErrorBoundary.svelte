<script lang="ts">
	import ErrorMessage from './ErrorMessage.svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		isLoading?: boolean;
		error?: string | null;
		loadingMessage?: string;
		retryable?: boolean;
		onRetry?: () => void;
		children?: import('svelte').Snippet;
	}

	let {
		isLoading = false,
		error = null,
		loadingMessage = '로딩 중...',
		retryable = false,
		onRetry,
		children
	}: Props = $props();
</script>

{#if isLoading}
	<div class="flex items-center justify-center py-8">
		<div class="text-center">
			<LoadingSpinner size="lg" class="mb-4" />
			<p class="text-sm text-gray-600">{loadingMessage}</p>
		</div>
	</div>
{:else if error}
	<div class="py-4">
		<ErrorMessage message={error} />
		{#if retryable && onRetry}
			<div class="mt-4 text-center">
				<button
					type="button"
					class="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
					onclick={onRetry}
				>
					<i class="fas fa-redo mr-1"></i>
					다시 시도
				</button>
			</div>
		{/if}
	</div>
{:else if children}
	{@render children()}
{/if}