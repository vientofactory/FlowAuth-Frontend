<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ModalProps {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		onClose?: () => void;
		class?: string;
	}

	let {
		open = false,
		title = '',
		size = 'md',
		header,
		children,
		footer,
		onClose,
		class: className = ''
	}: ModalProps = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose?.();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose?.();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="-1"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Modal panel -->
			<div
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6 {sizeClasses[
					size
				]} {className}"
			>
				<!-- Header -->
				{#if title || header}
					<div class="mb-4 flex items-center justify-between">
						{#if header}
							{@render header()}
						{:else if title}
							<h3 id="modal-title" class="text-lg font-semibold text-gray-900">
								{title}
							</h3>
						{/if}

						{#if onClose}
							<button
								type="button"
								class="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								onclick={onClose}
							>
								<span class="sr-only">Close</span>
								<i class="fas fa-times h-5 w-5"></i>
							</button>
						{/if}
					</div>
				{/if}

				<!-- Body -->
				<div class="mb-4">
					{#if children}
						{@render children()}
					{/if}
				</div>

				<!-- Footer -->
				{#if footer}
					<div class="flex justify-end space-x-3 border-t border-gray-200 pt-4">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Backdrop overlay -->
	<div class="bg-opacity-75 fixed inset-0 z-40 bg-gray-500 transition-opacity"></div>
{/if}
