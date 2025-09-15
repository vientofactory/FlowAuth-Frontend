<script lang="ts">
	import { fade } from 'svelte/transition';

	let {
		message = '',
		type = 'info',
		duration = 3000,
		show = $bindable(false),
		position = 'top-right'
	}: {
		message?: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		show?: boolean;
		position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
	} = $props();

	let timeoutId: number | undefined;

	// show prop이 변경될 때마다 실행
	$effect(() => {
		if (show) {
			// 기존 타이머가 있다면 제거
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// duration 후에 토스트 숨기기
			timeoutId = setTimeout(() => {
				show = false;
			}, duration) as unknown as number;
		} else {
			// show가 false가 되면 타이머 정리
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
		}
	});

	function getIcon() {
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

	function getColors() {
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

	function getPositionClasses() {
		const baseClasses = 'fixed z-50 animate-slide-in-right';
		
		switch (position) {
			case 'top-left':
				return `${baseClasses} top-4 left-4`;
			case 'bottom-right':
				return `${baseClasses} bottom-4 right-4`;
			case 'bottom-left':
				return `${baseClasses} bottom-4 left-4`;
			case 'top-center':
				return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
			case 'bottom-center':
				return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
			default: // top-right
				return `${baseClasses} top-4 right-4`;
		}
	}

	let colors = $derived(getColors());
	let iconClass = $derived(getIcon());
	let positionClasses = $derived(getPositionClasses());
</script>

{#if show}
	<div class={positionClasses} transition:fade={{ duration: 200 }}>
		<div
			class="flex items-center rounded-lg border-l-4 px-3 py-3 shadow-lg backdrop-blur-sm sm:px-4
			{colors.border} {colors.background}
			max-w-sm sm:max-w-md w-full mx-4 sm:mx-0"
		>
			<i class="mr-2 sm:mr-3 flex-shrink-0 {iconClass} {colors.icon} text-lg sm:text-xl"></i>
			<p class="font-medium {colors.text} text-sm sm:text-base flex-1 pr-2">{message}</p>
			<button
				onclick={() => {
					if (timeoutId) {
						clearTimeout(timeoutId);
						timeoutId = undefined;
					}
					show = false;
				}}
				class="flex-shrink-0 ml-2 text-gray-400 transition-colors duration-200 hover:text-gray-600 p-1"
				aria-label="알림 닫기"
			>
				<i class="fas fa-times text-sm sm:text-base"></i>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-in-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slide-in-left {
		from {
			transform: translateX(-100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slide-in-down {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes slide-in-up {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}

	.animate-slide-in-left {
		animation: slide-in-left 0.3s ease-out;
	}

	.animate-slide-in-down {
		animation: slide-in-down 0.3s ease-out;
	}

	.animate-slide-in-up {
		animation: slide-in-up 0.3s ease-out;
	}
</style>
