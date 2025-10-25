<script lang="ts">
	import QuickActionsCard from './QuickActionsCard.svelte';

	interface QuickAction {
		label: string;
		icon: string;
		color: string;
		action: () => void;
	}

	interface Props {
		quickActions: QuickAction[];
	}

	let { quickActions }: Props = $props();
</script>

<QuickActionsCard {quickActions} />
