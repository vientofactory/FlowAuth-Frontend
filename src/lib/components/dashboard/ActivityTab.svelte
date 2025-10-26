<script lang="ts">
	import RecentActivities from './RecentActivities.svelte';
	import { DashboardSkeleton } from '$lib';
	import { apiClient } from '$lib';
	import { useToast } from '$lib';

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
			ipAddress?: string;
			userAgent?: string;
			severity?: string;
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

	let activities = $state(recentActivities);
	let isLoadingMore = $state(false);
	let hasMore = $state(true);
	let currentLimit = $state(5);

	const toast = useToast();

	// activities prop이 변경되면 로컬 상태 업데이트
	$effect(() => {
		activities = recentActivities;
		currentLimit = 5;
		hasMore = true;
	});

	async function loadMoreActivities() {
		if (isLoadingMore) return;

		try {
			isLoadingMore = true;
			const newLimit = currentLimit + 5;
			const moreActivities = await apiClient.getRecentActivities(newLimit);

			activities = moreActivities;
			currentLimit = newLimit;

			// 더 이상 로드할 활동이 없으면 hasMore를 false로 설정
			if (moreActivities.length < newLimit) {
				hasMore = false;
			}
		} catch (error) {
			console.error('Failed to load more activities:', error);
			toast.error('활동을 더 불러오는데 실패했습니다.');
		} finally {
			isLoadingMore = false;
		}
	}
</script>

{#if isDashboardLoading}
	<DashboardSkeleton type="activity" count={5} />
{:else}
	<RecentActivities
		{activities}
		isLoading={isDashboardLoading}
		{hasMore}
		{isLoadingMore}
		onLoadMore={loadMoreActivities}
	/>
{/if}
