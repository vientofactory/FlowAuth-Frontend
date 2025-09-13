<script lang="ts">
	import { toastStore, toast } from '$lib/stores/toast';
	import type { ToastMessage } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';

	let toasts: ToastMessage[] = [];

	// 토스트 스토어 구독
	toastStore.subscribe((value) => {
		toasts = value;
	});

	function getIcon(type: ToastMessage['type']): string {
		switch (type) {
			case 'success':
				return 'fas fa-check-circle';
			case 'error':
				return 'fas fa-exclamation-circle';
			case 'warning':
				return 'fas fa-exclamation-triangle';
			default:
				return 'fas fa-info-circle';
		}
	}

	function getColors(type: ToastMessage['type']) {
		switch (type) {
			case 'success':
				return {
					border: 'border-green-500',
					background: 'bg-green-50',
					text: 'text-green-800',
					icon: 'text-green-500'
				};
			case 'error':
				return {
					border: 'border-red-500',
					background: 'bg-red-50',
					text: 'text-red-800',
					icon: 'text-red-500'
				};
			case 'warning':
				return {
					border: 'border-yellow-500',
					background: 'bg-yellow-50',
					text: 'text-yellow-800',
					icon: 'text-yellow-500'
				};
			default:
				return {
					border: 'border-blue-500',
					background: 'bg-blue-50',
					text: 'text-blue-800',
					icon: 'text-blue-500'
				};
		}
	}

	function handleRemove(id: string) {
		toast.remove(id);
	}
</script>

<!-- 토스트 컨테이너 -->
{#if toasts.length > 0}
	<div class="toast-container fixed top-4 right-4 z-50 space-y-2">
		{#each toasts as toastItem (toastItem.id)}
			{@const colors = getColors(toastItem.type)}
			{@const iconClass = getIcon(toastItem.type)}

			<div
				class="toast-item animate-slide-in-right flex items-center rounded-lg border-l-4 px-4 py-3 shadow-lg backdrop-blur-sm {colors.border} {colors.background}"
				transition:fly={{ x: 300, duration: 300 }}
			>
				<i class="mr-3 {iconClass} {colors.icon}"></i>
				<p class="flex-1 font-medium {colors.text}">{toastItem.message}</p>
				<button
					onclick={() => handleRemove(toastItem.id)}
					class="ml-4 text-gray-400 transition-colors duration-200 hover:text-gray-600"
					aria-label="알림 닫기"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		max-width: 400px;
		pointer-events: none;
	}

	.toast-item {
		pointer-events: auto;
		min-width: 300px;
		max-width: 400px;
		word-break: break-word;
	}

	@media (max-width: 640px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
			top: 1rem;
			max-width: none;
		}

		.toast-item {
			min-width: auto;
			max-width: none;
		}
	}
</style>
