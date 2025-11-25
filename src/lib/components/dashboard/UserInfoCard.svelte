<script lang="ts">
	import { Button, Badge } from '$lib';
	import type { User } from '$lib';
	import { USER_TYPES } from '$lib';
	import { PermissionUtils } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUser,
		faEnvelope,
		faIdCard,
		faShieldAlt,
		faUserTag,
		faEdit
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		user: User | null;
		isLoading: boolean;
		onNavigateToProfile: () => void;
	}

	let { user, isLoading, onNavigateToProfile }: Props = $props();
</script>

{#if isLoading}
	<!-- 사용자 정보 카드 스켈레톤 -->
	<div
		class="relative overflow-hidden rounded-xl bg-gradient-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
	>
		<div class="relative">
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
			>
				<div class="flex-1">
					<div class="mb-4 flex items-center text-lg font-semibold">
						<div class="mr-3 h-8 w-8 animate-pulse rounded-lg bg-gray-200"></div>
						<div class="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
					</div>
					<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
						{#each Array(5) as _, i (i)}
							<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
								<div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200"></div>
								<div>
									<div class="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200"></div>
									<div class="h-4 w-20 animate-pulse rounded bg-gray-100"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
				<div class="mt-4 flex justify-center sm:mt-0 sm:justify-end">
					<div class="h-10 w-24 animate-pulse rounded bg-gray-200"></div>
				</div>
			</div>
		</div>
	</div>
{:else if user}
	<div
		class="relative overflow-hidden rounded-xl bg-gradient-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
	>
		<div class="relative">
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
			>
				<div class="flex-1">
					<h3 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
						<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
							<FontAwesomeIcon icon={faUser} class="text-stone-600" />
						</div>
						계정 정보
					</h3>
					<div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
						<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
								<FontAwesomeIcon icon={faUser} class="text-stone-600" />
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">사용자명</p>
								<p class="font-medium text-gray-900">{user.username}</p>
							</div>
						</div>
						<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
								<FontAwesomeIcon icon={faEnvelope} class="text-neutral-600" />
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">이메일</p>
								<p class="font-medium text-gray-900">{user.email}</p>
							</div>
						</div>
						<div
							class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1"
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
								<FontAwesomeIcon icon={faIdCard} class="text-gray-600" />
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">이름</p>
								<p class="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
							</div>
						</div>
						<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
								<FontAwesomeIcon icon={faShieldAlt} class="text-slate-600" />
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">역할</p>
								<div class="flex items-center space-x-2">
									{#if user.permissions !== undefined}
										<Badge variant="info" size="sm" class="font-medium">
											{PermissionUtils.getRoleName(Number(user.permissions))}
										</Badge>
									{:else}
										<Badge variant="secondary" size="sm" class="font-medium">권한 없음</Badge>
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
								<FontAwesomeIcon icon={faUserTag} class="text-zinc-600" />
							</div>
							<div>
								<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">유형</p>
								<Badge
									variant={user.userType === USER_TYPES.DEVELOPER ? 'secondary' : 'info'}
									size="sm"
									class="font-medium"
								>
									{user.userType === USER_TYPES.DEVELOPER ? '개발자' : '사용자'}
								</Badge>
							</div>
						</div>
					</div>
				</div>
				<div class="mt-4 flex justify-center sm:mt-0 sm:justify-end">
					<Button
						variant="outline"
						onclick={onNavigateToProfile}
						class="w-full transition-colors hover:border-stone-200 hover:bg-stone-50 sm:w-auto"
					>
						<FontAwesomeIcon icon={faEdit} class="mr-2" />
						프로필 편집
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
