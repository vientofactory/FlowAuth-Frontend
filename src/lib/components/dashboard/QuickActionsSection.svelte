<script lang="ts">
	import { Card, Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface QuickAction {
		label: string;
		icon: IconDefinition | string;
		color: string;
		action: () => void;
	}

	interface Props {
		isDeveloper: boolean;
		quickActions: QuickAction[];
	}

	let { isDeveloper: _isDeveloper, quickActions }: Props = $props();
</script>

<Card>
	<h3 class="mb-4 text-lg font-semibold text-gray-900">빠른 작업</h3>
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each quickActions as action (action.label)}
			<Button
				variant="outline"
				onclick={action.action}
				class={`h-24 flex-col space-y-2 text-${action.color}-600 border-${action.color}-200 hover:bg-${action.color}-50`}
			>
				{#if typeof action.icon === 'string'}
					<i class="{action.icon} text-2xl"></i>
				{:else}
					<FontAwesomeIcon icon={action.icon} class="text-2xl" />
				{/if}
				<span class="text-center text-sm font-medium whitespace-pre-line">{action.label}</span>
			</Button>
		{/each}
	</div>
</Card>
