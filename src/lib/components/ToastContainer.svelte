<script lang="ts">
	import { toastStore, toast } from '$lib/stores/toast';
	import type { ToastMessage } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCheckCircle,
		faExclamationCircle,
		faExclamationTriangle,
		faInfoCircle,
		faTimes
	} from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	let toasts: ToastMessage[] = [];
	let timers: Map<string, number> = new Map();

	// 토스트 스토어 구독
	toastStore.subscribe((value) => {
		// 새로운 토스트들을 확인하고 타이머 설정
		const newToasts = value.filter((t) => !toasts.find((existing) => existing.id === t.id));
		newToasts.forEach((toastItem) => {
			if (toastItem.duration && toastItem.duration > 0) {
				const fadeDelay = Math.max(0, toastItem.duration - 300);
				const timerId = setTimeout(() => {
					// fadeOut을 true로 설정하여 out 트랜지션 시작
					toastStore.update((toasts) =>
						toasts.map((t) => (t.id === toastItem.id ? { ...t, fadeOut: true } : t))
					);
					// 트랜지션 duration 후 제거
					setTimeout(() => {
						toast.remove(toastItem.id);
						timers.delete(toastItem.id);
					}, 300);
				}, fadeDelay) as unknown as number;
				timers.set(toastItem.id, timerId);
			}
		});

		// 제거된 토스트들의 타이머 정리
		const removedToasts = toasts.filter((t) => !value.find((newToast) => newToast.id === t.id));
		removedToasts.forEach((toastItem) => {
			const timerId = timers.get(toastItem.id);
			if (timerId) {
				clearTimeout(timerId);
				timers.delete(toastItem.id);
			}
		});

		toasts = value;
	});

	function getIcon(type: ToastMessage['type']): IconDefinition {
		switch (type) {
			case 'success':
				return faCheckCircle;
			case 'error':
				return faExclamationCircle;
			case 'warning':
				return faExclamationTriangle;
			default:
				return faInfoCircle;
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
		// 타이머 정리
		const timerId = timers.get(id);
		if (timerId) {
			clearTimeout(timerId);
			timers.delete(id);
		}

		toast.remove(id);
	}

	// 컴포넌트 언마운트 시 모든 타이머 정리
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		timers.forEach((timerId) => clearTimeout(timerId));
		timers.clear();
	});
</script>

<!-- 토스트 컨테이너 -->
{#if toasts.length > 0}
	<div
		class="toast-container fixed top-4 right-4 z-[9999] space-y-2"
		style="z-index: 9999 !important;"
	>
		{#each toasts.filter((t) => !t.fadeOut) as toastItem (toastItem.id)}
			{@const colors = getColors(toastItem.type)}
			{@const icon = getIcon(toastItem.type)}

			<div
				class="toast-item animate-slide-in-right flex items-center rounded-lg border-l-4 px-4 py-3 shadow-lg backdrop-blur-sm {colors.border} {colors.background}"
				in:fly={{ x: 300, duration: 300 }}
				out:fly={{ x: 300, duration: 300 }}
				style="pointer-events: auto !important;"
			>
				<FontAwesomeIcon {icon} class="mr-3 {colors.icon}" />
				<p class="flex-1 font-medium {colors.text}">{toastItem.message}</p>
				<button
					onclick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						handleRemove(toastItem.id);
						return false;
					}}
					onmousedown={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					onmouseup={(event) => {
						event.preventDefault();
						event.stopPropagation();
					}}
					class="ml-4 cursor-pointer text-gray-400 transition-colors duration-200 select-none hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					aria-label="알림 닫기"
					type="button"
					style="pointer-events: auto !important; cursor: pointer !important;"
				>
					<FontAwesomeIcon icon={faTimes} />
				</button>
				{#if toastItem.duration && toastItem.duration > 0}
					<div
						class="progress-bar {colors.icon}"
						style="animation-duration: {toastItem.duration}ms;"
					></div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		max-width: 400px;
		pointer-events: auto !important;
		z-index: 9999 !important;
		position: fixed !important;
		top: 1rem !important;
		right: 1rem !important;
	}

	.toast-item {
		pointer-events: auto !important;
		min-width: 300px;
		max-width: 400px;
		word-break: break-word;
		z-index: 9999;
		position: relative;
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: currentColor;
		animation: progress linear forwards;
	}

	@keyframes progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
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
