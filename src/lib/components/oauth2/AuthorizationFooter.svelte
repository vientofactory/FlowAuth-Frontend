<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes, faCheck, faLock } from '@fortawesome/free-solid-svg-icons';

	export let submitting = false;
	export let onApprove: () => void;
	export let onDeny: () => void;
</script>

<div
	class="flex-shrink-0 border-t border-gray-100 bg-white/95 p-4 pt-3 backdrop-blur-sm sm:p-6 sm:pt-4"
	role="contentinfo"
>
	<!-- Action Buttons -->
	<div class="mb-3 sm:mb-4">
		<div class="flex space-x-2 sm:space-x-3">
			<Button
				variant="secondary"
				class="oauth-button h-10 flex-1 text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg sm:h-12 sm:text-base"
				onclick={onDeny}
				disabled={submitting}
			>
				{#if submitting}
					<Loading size="sm" />
				{:else}
					<span aria-hidden="true"><FontAwesomeIcon icon={faTimes} class="mr-1 sm:mr-2" /></span>
				{/if}
				거부하기
			</Button>

			<Button
				variant="primary"
				class="oauth-button h-10 flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg sm:h-12 sm:text-base"
				onclick={onApprove}
				disabled={submitting}
			>
				{#if submitting}
					<Loading size="sm" />
				{:else}
					<span aria-hidden="true"><FontAwesomeIcon icon={faCheck} class="mr-1 sm:mr-2" /></span>
				{/if}
				인가하기
			</Button>
		</div>

		<!-- Hidden descriptions for screen readers -->
		<div class="sr-only">
			<div id="approve-desc">이 애플리케이션에 요청된 모든 권한을 승인합니다</div>
			<div id="deny-desc">이 애플리케이션의 액세스 요청을 거부합니다</div>
		</div>
	</div>

	<!-- Footer Info -->
	<div class="text-center">
		<p class="mb-2 text-xs text-gray-500">
			<span aria-hidden="true"><FontAwesomeIcon icon={faLock} class="mr-1" /></span>
			Powered by <strong class="text-indigo-600">FlowAuth</strong>
		</p>
		<div class="flex justify-center space-x-2 text-xs text-gray-400 sm:space-x-3">
			<a href="/privacy" class="underline transition-colors duration-200 hover:text-gray-600">
				개인정보
			</a>
			<a href="/terms" class="underline transition-colors duration-200 hover:text-gray-600">
				약관
			</a>
			<a href="/help" class="underline transition-colors duration-200 hover:text-gray-600">
				도움말
			</a>
		</div>
	</div>
</div>
