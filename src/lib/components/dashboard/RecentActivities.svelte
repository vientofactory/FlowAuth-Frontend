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
	}

	let { activities, isLoading = false }: Props = $props();

	// 활동 타입별 아이콘과 색상
	function getActivityIcon(type: string): { icon: string; color: string } {
		switch (type) {
			case 'login':
				return { icon: 'fas fa-sign-in-alt', color: 'bg-blue-100 text-blue-600' };
			case 'account_created':
				return { icon: 'fas fa-user-plus', color: 'bg-emerald-100 text-emerald-600' };
			case 'client_created':
				return { icon: 'fas fa-plus', color: 'bg-purple-100 text-purple-600' };
			case 'token_created':
				return { icon: 'fas fa-key', color: 'bg-green-100 text-green-600' };
			case 'client_updated':
				return { icon: 'fas fa-edit', color: 'bg-orange-100 text-orange-600' };
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
				{#each activities.slice(0, 10) as activity (activity.createdAt)}
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

			{#if activities.length > 10}
				<div class="mt-4 text-center">
					<button
						class="text-sm font-medium text-blue-600 hover:text-blue-800"
						onclick={() => {
							// TODO: 더 많은 활동 보기 페이지로 이동
						}}
					>
						더 많은 활동 보기
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
