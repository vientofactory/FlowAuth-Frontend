<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ApiError } from '$lib/utils/error-handler';
	import { getErrorActions } from '$lib/utils/error-handler';
	import { Button } from '$lib';

	interface Props {
		error: ApiError;
		showActions?: boolean;
		autoClose?: boolean;
		closeDuration?: number;
	}

	let { error, showActions = true, autoClose = false, closeDuration = 5000 }: Props = $props();

	const dispatch = createEventDispatcher<{
		close: void;
		action: { action: string; error: ApiError };
	}>();

	let isVisible = $state(true);

	// 자동 닫기
	if (autoClose && closeDuration > 0) {
		setTimeout(() => {
			handleClose();
		}, closeDuration);
	}

	function handleClose() {
		isVisible = false;
		setTimeout(() => {
			dispatch('close');
		}, 300); // 애니메이션 완료 후 닫기
	}

	function handleAction(actionType: string) {
		dispatch('action', { action: actionType, error });
	}

	// 에러 타입에 따른 아이콘 반환
	function getErrorIcon(status: number): string {
		if (status === 0) return 'fas fa-wifi-slash'; // 네트워크 오류
		if (status === 401) return 'fas fa-lock';
		if (status === 403) return 'fas fa-ban';
		if (status === 404) return 'fas fa-search';
		if (status === 422 || status === 400) return 'fas fa-exclamation-circle';
		if (status >= 500) return 'fas fa-server';
		return 'fas fa-exclamation-triangle';
	}

	// 에러 타입에 따른 색상 클래스 반환
	function getErrorColorClass(status: number): string {
		if (status === 0) return 'bg-gray-500'; // 네트워크
		if (status === 401 || status === 403) return 'bg-orange-500'; // 인증/권한
		if (status === 404) return 'bg-blue-500'; // 찾을 수 없음
		if (status === 422 || status === 400) return 'bg-yellow-500'; // 검증 오류
		if (status >= 500) return 'bg-red-500'; // 서버 오류
		return 'bg-gray-500'; // 기타
	}

	const actions = $derived(showActions ? getErrorActions(error) : []);
</script>

{#if isVisible}
	<div
		class="error-toast-container fixed top-4 right-4 z-50 w-full max-w-md transform transition-all duration-300 ease-out {isVisible
			? 'translate-x-0 opacity-100'
			: 'translate-x-full opacity-0'}"
		role="alert"
		aria-live="assertive"
	>
		<div class="ring-opacity-5 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black">
			<!-- 에러 헤더 -->
			<div class="flex items-center p-4">
				<div class="shrink-0">
					<div
						class="{getErrorColorClass(
							error.status
						)} flex h-10 w-10 items-center justify-center rounded-full"
					>
						<i class="{getErrorIcon(error.status)} text-white"></i>
					</div>
				</div>
				<div class="ml-3 flex-1">
					<p class="text-sm font-medium text-gray-900">
						{error.status === 0 ? '네트워크 오류' : `오류 ${error.status}`}
					</p>
					<p class="mt-1 text-sm text-gray-500">
						{error.message}
					</p>
				</div>
				<div class="ml-4 shrink-0">
					<button
						onclick={handleClose}
						class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						aria-label="닫기"
					>
						<i class="fas fa-times h-5 w-5"></i>
					</button>
				</div>
			</div>

			<!-- 액션 버튼들 -->
			{#if actions.length > 0}
				<div class="border-t border-gray-200 bg-gray-50 px-4 py-3">
					<div class="flex space-x-2">
						{#each actions as action (action.action)}
							<Button
								variant={action.variant === 'primary' ? 'primary' : 'outline'}
								size="sm"
								onclick={() => handleAction(action.action)}
								class="text-xs"
							>
								{action.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 진행률 바 (자동 닫기가 활성화된 경우) -->
			{#if autoClose && closeDuration > 0}
				<div class="h-1 bg-gray-200">
					<div
						class="{getErrorColorClass(error.status)} h-full transition-all ease-linear"
						style="width: 100%; animation: shrink {closeDuration}ms linear forwards;"
					></div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.error-toast-container {
		animation: slideInRight 0.3s ease-out;
	}

	@keyframes slideInRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}

	/* 접근성을 위한 reduced motion 지원 */
	@media (prefers-reduced-motion: reduce) {
		.error-toast-container,
		.error-toast-container * {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
