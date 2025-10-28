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
		recentActivities: {
			activities: Activity[];
			total: number;
		};
		isDashboardLoading: boolean;
	}

	let { recentActivities, isDashboardLoading }: Props = $props();

	let activities = $state(recentActivities.activities);
	let total = $state(recentActivities.total);
	let isLoadingMore = $state(false);
	let currentOffset = $state(5);
	let hasMore = $derived(currentOffset < total);

	const toast = useToast();

	// props이 변경되면 로컬 상태 업데이트 (초기 로드 시)
	$effect(() => {
		if (recentActivities.activities.length > 0 && activities.length === 0) {
			// 초기 로드 시에만 activities 설정
			activities = recentActivities.activities;
			total = recentActivities.total;
			currentOffset = 5;
			hasMore = activities.length < total;
		} else if (recentActivities.total !== total) {
			// total이 변경된 경우에만 업데이트
			total = recentActivities.total;
			hasMore = activities.length < total;
		}
	});

	async function loadMoreActivities() {
		if (isLoadingMore || !hasMore) return;

		try {
			isLoadingMore = true;
			const data = await apiClient.getRecentActivities(5, currentOffset);

			activities = [...activities, ...data.activities];
			currentOffset += 5;
			hasMore = currentOffset < total;
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
