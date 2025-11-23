<script lang="ts">
	import QuickActionsCard from './QuickActionsCard.svelte';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface QuickAction {
		label: string;
		icon: IconDefinition | string;
		color: string;
		action: () => void;
	}

	interface Props {
		quickActions: QuickAction[];
	}

	let { quickActions }: Props = $props();
</script>

<QuickActionsCard {quickActions} />
