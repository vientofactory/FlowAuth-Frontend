<script lang="ts">
	import { fade } from 'svelte/transition';

	let {
		message = '',
		type = 'info',
		duration = 3000,
		show = $bindable(false)
	}: {
		message?: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		show?: boolean;
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
				// 부모 컴포넌트에 토스트가 숨겨졌음을 알림 (필요시)
				show = false;
			}, duration);
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

	let colors = $derived(getColors());
	let iconClass = $derived(getIcon());
</script>

{#if show}
	<div class="animate-slide-in-right fixed top-4 right-4 z-50" transition:fade={{ duration: 200 }}>
		<div
			class="flex items-center rounded-lg border-l-4 px-4 py-3 shadow-lg backdrop-blur-sm {colors.border} {colors.background}"
		>
			<i class="mr-3 {iconClass} {colors.icon}"></i>
			<p class="font-medium {colors.text}">{message}</p>
			<button
				onclick={() => {
					if (timeoutId) {
						clearTimeout(timeoutId);
						timeoutId = undefined;
					}
					show = false;
				}}
				class="ml-4 text-gray-400 transition-colors duration-200 hover:text-gray-600"
				aria-label="알림 닫기"
			>
				<i class="fas fa-times"></i>
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

	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}
</style>
