<script lang="ts">
	import type { Snippet } from 'svelte';

	interface DropdownItem {
		id: string;
		label: string;
		icon?: string;
		disabled?: boolean;
		danger?: boolean;
		separator?: boolean;
	}

	interface DropdownProps {
		items?: DropdownItem[];
		position?: 'left' | 'right';
		trigger?: Snippet;
		content?: Snippet;
		onSelect?: (item: DropdownItem) => void;
		class?: string;
	}

	let {
		items = [],
		position = 'right',
		trigger,
		content,
		onSelect,
		class: className = ''
	}: DropdownProps = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function handleItemClick(item: DropdownItem) {
		if (item.disabled || item.separator) return;
		onSelect?.(item);
		closeDropdown();
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			closeDropdown();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeDropdown();
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		} else {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	const positionClasses = {
		left: 'right-0 origin-top-right',
		right: 'left-0 origin-top-left'
	};
</script>

<div class="relative inline-block text-left {className}" bind:this={dropdownRef}>
	<!-- Trigger -->
	<div
		onclick={toggleDropdown}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? toggleDropdown() : null)}
		role="button"
		tabindex="0"
	>
		{#if trigger}
			{@render trigger()}
		{:else}
			<button
				type="button"
				class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
			>
				Options
				<i class="fas fa-chevron-down -mr-1 h-5 w-5 text-gray-400"></i>
			</button>
		{/if}
	</div>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="ring-opacity-5 absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none {positionClasses[
				position
			]}"
			role="menu"
			aria-orientation="vertical"
		>
			<div class="py-1" role="none">
				{#if content}
					{@render content()}
				{:else}
					{#each items as item, index (index)}
						{#if item.separator}
							<div class="my-1 border-t border-gray-100" role="separator"></div>
						{:else}
							<button
								type="button"
								class={`
									group flex w-full items-center px-4 py-2 text-sm transition-colors
									${
										item.disabled
											? 'cursor-not-allowed text-gray-400'
											: item.danger
												? 'text-red-700 hover:bg-red-50 hover:text-red-900'
												: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
									}
								`}
								role="menuitem"
								disabled={item.disabled}
								onclick={() => handleItemClick(item)}
							>
								{#if item.icon}
									<i class="{item.icon} mr-3 h-4 w-4"></i>
								{/if}
								{item.label}
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
