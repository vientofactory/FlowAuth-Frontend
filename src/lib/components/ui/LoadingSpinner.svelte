<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		color?: 'blue' | 'white' | 'gray';
		speed?: 'slow' | 'normal' | 'fast';
	}

	let {
		size = 'md',
		class: className = '',
		color = 'blue',
		speed = 'normal'
	}: Props = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	};

	const colorClasses = {
		blue: 'border-blue-600',
		white: 'border-white',
		gray: 'border-gray-600'
	};

	const speedClasses = {
		slow: 'animate-spin-slow',
		normal: 'animate-spin',
		fast: 'animate-spin-fast'
	};
</script>

<div
	class="inline-block rounded-full border-2 border-solid border-r-transparent {sizeClasses[size]} {colorClasses[color]} {speedClasses[speed]} {className}"
	role="status"
	aria-label="로딩 중"
>
	<span class="sr-only">로딩 중...</span>
</div>

<style>
	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes spin-fast {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.animate-spin-slow) {
		animation: spin-slow 2s linear infinite;
	}

	:global(.animate-spin-fast) {
		animation: spin-fast 0.5s linear infinite;
	}
</style>