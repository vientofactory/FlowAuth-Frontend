<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		icon?: string;
		disabled?: boolean;
		badge?: string | number;
	}

	interface TabsProps {
		tabs: Tab[];
		activeTab?: string;
		onTabChange?: (tabId: string) => void;
		variant?: 'default' | 'pills' | 'underline';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: Snippet<[{ activeTab: string }]>;
	}

	let {
		tabs = [],
		activeTab = $bindable(tabs[0]?.id || ''),
		onTabChange,
		variant = 'default',
		size = 'md',
		class: className = '',
		children
	}: TabsProps = $props();

	const sizeClasses = {
		sm: 'text-sm px-2 py-1.5 sm:px-3 sm:py-2',
		md: 'text-sm px-3 py-2 sm:px-4',
		lg: 'text-base px-4 py-2 sm:px-6 sm:py-3'
	};

	const variantClasses = {
		default: {
			container: 'border-b border-gray-200',
			tab: 'border-transparent border-b-2 hover:border-gray-300 hover:text-gray-700',
			activeTab: 'border-blue-500 text-blue-600',
			inactiveTab: 'text-gray-500'
		},
		pills: {
			container: 'bg-gray-100 rounded-lg p-1',
			tab: 'rounded-md transition-all duration-200',
			activeTab: 'bg-white text-blue-600 shadow-sm',
			inactiveTab: 'text-gray-600 hover:text-gray-900'
		},
		underline: {
			container: 'border-b border-gray-200',
			tab: 'border-transparent border-b-2 hover:border-gray-300',
			activeTab: 'border-blue-500 text-blue-600',
			inactiveTab: 'text-gray-500 hover:text-gray-700'
		}
	};

	function handleTabClick(tab: Tab) {
		if (tab.disabled) return;
		activeTab = tab.id;
		onTabChange?.(tab.id);
	}
</script>

<div class={className}>
	<!-- Tab Navigation -->
	<nav class={`flex overflow-x-auto ${variantClasses[variant].container}`} aria-label="Tabs">
		<div class="flex min-w-full space-x-1">
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					class={`
						${sizeClasses[size]}
						${variantClasses[variant].tab}
						${activeTab === tab.id ? variantClasses[variant].activeTab : variantClasses[variant].inactiveTab}
						${tab.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
						flex-shrink-0 font-medium whitespace-nowrap transition-colors duration-200 focus:ring-2 focus:ring-blue-500
						focus:ring-offset-2 focus:outline-none
					`}
					onclick={() => handleTabClick(tab)}
					disabled={tab.disabled}
					aria-selected={activeTab === tab.id}
					role="tab"
				>
					<div class="flex items-center space-x-1 sm:space-x-2">
						{#if tab.icon}
							<i class={tab.icon}></i>
						{/if}
						<span>{tab.label}</span>
						{#if tab.badge}
							<span
								class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 px-1 py-0.5 text-xs font-medium text-gray-600 sm:ml-2 sm:h-5 sm:w-auto sm:min-w-[1.25rem] sm:px-2"
							>
								{tab.badge}
							</span>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</nav>

	<!-- Tab Content -->
	<div class="mt-4" role="tabpanel">
		{#if children}
			{@render children({ activeTab })}
		{/if}
	</div>
</div>
