<script lang="ts">
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
		activities: Activity[];
		isLoading?: boolean;
		hasMore?: boolean;
		isLoadingMore?: boolean;
		onLoadMore?: () => void;
	}

	let {
		activities,
		isLoading = false,
		hasMore = false,
		isLoadingMore = false,
		onLoadMore
	}: Props = $props();

	// 활동 타입별 아이콘과 색상
	function getActivityIcon(type: string): { icon: string; color: string } {
		switch (type) {
			case 'login':
				return { icon: 'fas fa-sign-in-alt', color: 'bg-stone-100 text-stone-600' };
			case 'login_failed':
				return { icon: 'fas fa-exclamation-triangle', color: 'bg-red-100 text-red-600' };
			case 'account_created':
				return { icon: 'fas fa-user-plus', color: 'bg-neutral-100 text-neutral-600' };
			case 'client_created':
				return { icon: 'fas fa-plus', color: 'bg-gray-100 text-gray-600' };
			case 'token_created':
				return { icon: 'fas fa-key', color: 'bg-slate-100 text-slate-600' };
			case 'client_updated':
				return { icon: 'fas fa-edit', color: 'bg-zinc-100 text-zinc-600' };
			case 'token_revoked':
				return { icon: 'fas fa-ban', color: 'bg-red-100 text-red-600' };
			default:
				return { icon: 'fas fa-circle', color: 'bg-gray-100 text-gray-600' };
		}
	}

	function formatActivityDescription(activity: Activity): string {
		const { type, description, metadata } = activity;

		switch (type) {
			case 'login':
				return metadata?.location ? `${description} (${metadata.location})` : description;
			case 'login_failed':
				return metadata?.reason ? `로그인 실패: ${metadata.reason}` : '로그인 실패';
			case 'client_created':
				return metadata?.clientName ? `클라이언트 "${metadata.clientName}" 생성됨` : description;
			case 'client_updated':
				return metadata?.clientName ? `클라이언트 "${metadata.clientName}" 수정됨` : description;
			case 'token_created':
				if (metadata?.clientName && metadata.scopes) {
					return `"${metadata.clientName}"에 대한 토큰 발급 (${metadata.scopes.join(', ')})`;
				}
				return description;
			case 'token_revoked':
				return metadata?.reason ? `${description} (${metadata.reason})` : description;
			default:
				return description;
		}
	}

	function formatTimeAgo(date: string | Date): string {
		const now = new Date();
		const activityDate = new Date(date);
		const diffInMs = now.getTime() - activityDate.getTime();
		const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInMinutes < 1) return '방금 전';
		if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
		if (diffInHours < 24) return `${diffInHours}시간 전`;
		if (diffInDays < 7) return `${diffInDays}일 전`;

		return activityDate.toLocaleDateString('ko-KR');
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
	<div class="border-b border-gray-200 px-6 py-4">
		<h3 class="flex items-center text-lg font-semibold text-gray-900">
			<i class="fas fa-history mr-2 text-gray-500"></i>
			최근 활동
		</h3>
	</div>

	<div class="p-6">
		{#if isLoading}
			<div class="space-y-3">
				{#each Array(5) as _, _i (_i)}
					<div class="animate-pulse">
						<div class="flex items-start space-x-3">
							<div class="h-8 w-8 rounded-full bg-gray-200"></div>
							<div class="flex-1">
								<div class="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
								<div class="h-3 w-1/2 rounded bg-gray-200"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if activities.length === 0}
			<div class="py-8 text-center">
				<i class="fas fa-inbox mb-3 text-3xl text-gray-400"></i>
				<p class="text-gray-500">최근 활동이 없습니다.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each activities as activity (activity.createdAt)}
					{@const iconData = getActivityIcon(activity.type)}
					<div class="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
						<div class="flex-shrink-0">
							<div class="h-8 w-8 {iconData.color} flex items-center justify-center rounded-full">
								<i class="{iconData.icon} text-sm"></i>
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-gray-900">
								{formatActivityDescription(activity)}
							</p>
							<p class="mt-1 text-xs text-gray-500">
								{formatTimeAgo(activity.createdAt)}
							</p>
						</div>
					</div>
				{/each}
			</div>

			{#if hasMore}
				<div class="mt-4 text-center">
					<button
						class="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
						onclick={onLoadMore}
						disabled={isLoadingMore}
					>
						{#if isLoadingMore}
							<i class="fas fa-spinner fa-spin mr-2"></i>
							불러오는 중...
						{:else}
							<i class="fas fa-plus mr-2"></i>
							더 많은 활동 보기
						{/if}
					</button>
				</div>
			{:else if activities.length > 0}
				<div class="mt-4 text-center">
					<p class="text-sm text-gray-500">모든 활동을 불러왔습니다.</p>
				</div>
			{/if}
		{/if}
	</div>
</div>
