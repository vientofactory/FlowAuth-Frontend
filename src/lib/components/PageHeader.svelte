<script lang="ts">
	let {
		title,
		subtitle,
		actions = []
	}: {
		title: string;
		subtitle?: string;
		actions?: Array<{
			label: string;
			onClick: () => void;
			variant?: 'primary' | 'secondary' | 'outline';
			icon?: string;
		}>;
	} = $props();
</script>

<div class="mb-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">{title}</h1>
			{#if subtitle}
				<p class="mt-2 text-lg text-gray-600">{subtitle}</p>
			{/if}
		</div>
		{#if actions.length > 0}
			<div class="flex space-x-3">
				{#each actions as action (action.label)}
					<button
						onclick={action.onClick}
						class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					>
						{#if action.icon}
							<i class="fas {action.icon} mr-2"></i>
						{/if}
						{action.label}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
