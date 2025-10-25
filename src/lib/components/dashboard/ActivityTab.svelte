<script lang="ts">
	import RecentActivities from './RecentActivities.svelte';
	import { DashboardSkeleton } from '$lib';

	type Activity = {
		id: number;
		type: string;
		description: string;
		createdAt: string | Date;
		resourceId?: number;
		metadata?: {
			clientName?: string;
			clientId?: number;
			scopes?: string[];
			reason?: string;
			activity?: string;
			location?: string;
			userId?: number;
			details?: {
				scopes?: string[];
				expiresAt?: string;
				isActive?: boolean;
				isConfidential?: boolean;
				description?: string;
				createdAt?: string;
				updatedAt?: string;
				tokenId?: number;
			};
		};
	};

	interface Props {
		recentActivities: Activity[];
		isDashboardLoading: boolean;
	}

	let { recentActivities, isDashboardLoading }: Props = $props();
</script>

{#if isDashboardLoading}
	<DashboardSkeleton type="activity" count={5} />
{:else}
	<RecentActivities activities={recentActivities} isLoading={isDashboardLoading} />
{/if}
