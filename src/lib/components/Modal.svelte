<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';

	interface ModalProps {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		onClose?: () => void;
		onConfirm?: () => void;
		onCancel?: () => void;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'primary' | 'secondary' | 'danger' | 'outline';
		showFooter?: boolean;
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
		onConfirm,
		onCancel,
		confirmText = '확인',
		cancelText = '취소',
		confirmVariant = 'primary',
		showFooter = true,
		class: className = ''
	}: ModalProps = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
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

<!-- Modal wrapper - always rendered for smooth transitions -->
<div class="fixed inset-0 z-[60]" class:invisible={!open} class:visible={open}>
	<!-- Backdrop overlay -->
	<div
		class="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
		class:opacity-0={!open}
		class:opacity-100={open}
		onclick={handleBackdropClick}
		role="presentation"
	></div>

	<!-- Modal container -->
	<div
		class="fixed inset-0 overflow-y-auto transition-opacity duration-300"
		class:opacity-0={!open}
		class:opacity-100={open}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal={open}
		aria-labelledby={title && open ? 'modal-title' : undefined}
		tabindex={open ? -1 : undefined}
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Modal panel -->
			<div
				class="relative w-full transform overflow-hidden rounded-t-lg bg-white text-left shadow-xl sm:rounded-lg
				{sizeClasses[size]} {className}
				max-h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300
				ease-out sm:my-8 sm:max-h-[90vh]"
				class:scale-90={!open}
				class:scale-100={open}
				class:opacity-0={!open}
				class:opacity-100={open}
			>
				{#if open}
					<!-- Mobile drag handle -->
					<div class="mx-auto mt-3 block h-1 w-12 rounded-full bg-gray-300 sm:hidden"></div>

					<!-- Header -->
					{#if title || header}
						<div class="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
							{#if header}
								{@render header()}
							{:else if title}
								<div class="flex items-center justify-between">
									<h3
										id="modal-title"
										class="pr-4 text-base font-semibold text-gray-900 sm:text-lg"
									>
										{title}
									</h3>
									{#if onClose}
										<button
											type="button"
											class="shrink-0 rounded-md bg-white p-2 text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
											onclick={onClose}
										>
											<span class="sr-only">Close</span>
											<FontAwesomeIcon icon={faTimes} class="h-4 w-4 sm:h-5 sm:w-5" />
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Body -->
					<div class="px-4 py-4 sm:px-6 sm:py-6">
						{#if children}
							{@render children()}
						{/if}
					</div>

					<!-- Footer -->
					{#if footer}
						<div
							class="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:justify-end sm:space-x-3 sm:px-6 sm:py-4"
						>
							{@render footer()}
						</div>
					{:else if showFooter}
						<div
							class="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:justify-end sm:space-x-3 sm:px-6 sm:py-4"
						>
							{#if onCancel}
								<Button variant="outline" onclick={onCancel}>
									{cancelText}
								</Button>
							{/if}
							{#if onConfirm}
								<Button variant={confirmVariant} onclick={onConfirm}>
									{confirmText}
								</Button>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>
