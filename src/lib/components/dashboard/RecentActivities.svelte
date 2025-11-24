<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faHistory,
		faInbox,
		faSignInAlt,
		faExclamationTriangle,
		faUserPlus,
		faPlus,
		faKey,
		faEdit,
		faBan,
		faCircle,
		faMapMarkerAlt,
		faDesktop,
		faSpinner
	} from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

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
	function getActivityIcon(type: string): { icon: IconDefinition; color: string } {
		switch (type) {
			case 'login':
				return { icon: faSignInAlt, color: 'bg-stone-100 text-stone-600' };
			case 'login_failed':
				return { icon: faExclamationTriangle, color: 'bg-red-100 text-red-600' };
			case 'account_created':
				return { icon: faUserPlus, color: 'bg-neutral-100 text-neutral-600' };
			case 'client_created':
				return { icon: faPlus, color: 'bg-gray-100 text-gray-600' };
			case 'token_created':
				return { icon: faKey, color: 'bg-slate-100 text-slate-600' };
			case 'client_updated':
				return { icon: faEdit, color: 'bg-zinc-100 text-zinc-600' };
			case 'token_revoked':
				return { icon: faBan, color: 'bg-red-100 text-red-600' };
			default:
				return { icon: faCircle, color: 'bg-gray-100 text-gray-600' };
		}
	}

	function formatActivityDescription(activity: Activity): string {
		const { type, description, metadata } = activity;

		switch (type) {
			case 'login':
				return description;
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

	function parseUserAgent(ua: string): { browser: string; os: string; device: string } {
		if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

		let browser = 'Unknown';
		let os = 'Unknown';
		let device = 'Desktop';

		// Browser detection
		if (ua.includes('Chrome') && !ua.includes('Edg/')) {
			browser = 'Chrome';
		} else if (ua.includes('Firefox')) {
			browser = 'Firefox';
		} else if (ua.includes('Safari') && !ua.includes('Chrome')) {
			browser = 'Safari';
		} else if (ua.includes('Edg/')) {
			browser = 'Edge';
		} else if (ua.includes('Opera') || ua.includes('OPR/')) {
			browser = 'Opera';
		} else if (ua.includes('MSIE') || ua.includes('Trident/')) {
			browser = 'Internet Explorer';
		}

		// OS detection
		if (ua.includes('Windows NT')) {
			os = 'Windows';
		} else if (ua.includes('Mac OS X')) {
			os = 'macOS';
		} else if (ua.includes('Linux')) {
			os = 'Linux';
		} else if (ua.includes('Android')) {
			os = 'Android';
		} else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
			os = 'iOS';
		}

		// Device detection
		if (ua.includes('Mobile') || (ua.includes('Android') && !ua.includes('Tablet'))) {
			device = 'Mobile';
		} else if (ua.includes('Tablet') || ua.includes('iPad')) {
			device = 'Tablet';
		} else if (ua.includes('TV') || ua.includes('SmartTV')) {
			device = 'TV';
		}

		return { browser, os, device };
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
	<div class="border-b border-gray-200 px-6 py-4">
		<h3 class="flex items-center text-lg font-semibold text-gray-900">
			<FontAwesomeIcon icon={faHistory} class="mr-2 text-gray-500" />
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
				<FontAwesomeIcon icon={faInbox} class="mb-3 text-3xl text-gray-400" />
				<p class="text-gray-500">최근 활동이 없습니다.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each activities as activity (activity.createdAt)}
					{@const iconData = getActivityIcon(activity.type)}
					<div class="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
						<div class="flex-shrink-0">
							<div class="h-8 w-8 {iconData.color} flex items-center justify-center rounded-full">
								<FontAwesomeIcon icon={iconData.icon} class="text-sm" />
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-gray-900">
								{formatActivityDescription(activity)}
							</p>
							{#if (activity.type === 'login' || activity.type === 'login_failed') && (activity.metadata?.ipAddress || activity.metadata?.userAgent)}
								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
									{#if activity.metadata.ipAddress}
										<span class="flex items-center">
											<FontAwesomeIcon icon={faMapMarkerAlt} class="mr-1 text-gray-400" />
											{activity.metadata.ipAddress}
										</span>
									{/if}
									{#if activity.metadata.userAgent}
										{@const uaInfo = parseUserAgent(activity.metadata.userAgent)}
										<span class="flex items-center" title={activity.metadata.userAgent}>
											<FontAwesomeIcon icon={faDesktop} class="mr-1 text-gray-400" />
											{uaInfo.browser} • {uaInfo.os} • {uaInfo.device}
										</span>
									{/if}
								</div>
							{/if}
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
							<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
							불러오는 중...
						{:else}
							<FontAwesomeIcon icon={faPlus} class="mr-2" />
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
