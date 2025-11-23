<script lang="ts">
	import { onMount } from 'svelte';
	import type { User } from '$lib/types/user.types';
	import Logo from '$lib/components/Logo.svelte';
	import { env } from '$lib/config/env';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faExclamationTriangle,
		faShieldAlt,
		faRepeat,
		faUser,
		faSignInAlt
	} from '@fortawesome/free-solid-svg-icons';

	// Props
	export let currentUser: User | null = null;
	export let loading: boolean = false;
	// Optional callback for when account switch is initiated
	export let onAccountSwitch: (() => void) | undefined = undefined;

	let error: string | null = null;
	let _mounted = false; // 마운트 상태

	// 상태 관리 - 사용자 정보가 있으면 로딩 상태가 아님
	$: isLoading = loading && !currentUser;

	// 계정 전환 핸들러
	function handleSwitchAccount() {
		// 콜백 호출 (있는 경우)
		if (onAccountSwitch) {
			onAccountSwitch();
		}

		// OAuth2 동의 페이지에서 다른 계정으로 로그인하기 위해
		// 현재 쿼리 파라미터를 유지한 채로 로그인 페이지로 리다이렉트
		const currentUrl = new URL(window.location.href);
		const loginUrl = new URL('/auth/login', window.location.origin);

		// OAuth2 파라미터들을 로그인 페이지로 전달
		const returnUrlParam = currentUrl.pathname + currentUrl.search;
		loginUrl.searchParams.set('returnUrl', returnUrlParam);

		console.log('[AccountSwitcher] Current URL:', currentUrl.href);
		console.log('[AccountSwitcher] Return URL param:', returnUrlParam);
		console.log('[AccountSwitcher] Login URL:', loginUrl.toString());
		console.log('[AccountSwitcher] Redirecting to login with returnUrl:', returnUrlParam);

		window.location.href = loginUrl.toString();
	}

	// 아바타 URL 생성
	function getAvatarUrl(avatarPath?: string | null): string | null {
		if (!avatarPath || avatarPath.trim() === '') return null;

		const trimmedPath = avatarPath.trim();

		// 빈 문자열이나 placeholder 값인 경우 null 반환
		if (trimmedPath === '' || trimmedPath === 'null' || trimmedPath === 'undefined') {
			return null;
		}

		// 상대 경로인 경우 백엔드 호스트를 붙임
		if (trimmedPath.startsWith('/uploads/')) {
			return `${env.API_BASE_URL}${trimmedPath}`;
		}

		// 이미 절대 URL인 경우 그대로 반환
		try {
			new URL(trimmedPath);
			return trimmedPath;
		} catch {
			// 유효하지 않은 URL인 경우 null 반환
			return null;
		}
	}

	// 사용자 표시 이름 생성
	function getDisplayName(user: User): string {
		if (user.firstName || user.lastName) {
			return `${user.firstName || ''} ${user.lastName || ''}`.trim();
		}
		return user.username;
	}

	onMount(() => {
		_mounted = true;
	});
</script>

<div class="border-b border-gray-100 bg-white">
	{#if isLoading}
		<div class="animate-fadeIn px-6 py-4">
			<!-- 스켈레톤 로딩 - 단순화된 애니메이션 -->
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<!-- 아바타 스켈레톤 -->
					<div class="relative">
						<div class="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
						<!-- 활성 상태 표시기 스켈레톤 -->
						<div
							class="absolute -right-0.5 -bottom-0.5 h-3 w-3 animate-pulse rounded-full bg-gray-300"
						></div>
					</div>

					<!-- 사용자 정보 스켈레톤 -->
					<div class="flex-1 space-y-1.5">
						<div class="flex items-center space-x-2">
							<!-- 이름 스켈레톤 -->
							<div class="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
							<!-- 보안 아이콘 스켈레톤 -->
							<div class="h-3 w-3 animate-pulse rounded bg-gray-200"></div>
						</div>
						<!-- 이메일 스켈레톤 -->
						<div class="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
					</div>
				</div>

				<!-- 액션 버튼 스켈레톤 -->
				<div class="h-7 w-20 animate-pulse rounded-md bg-gray-200"></div>
			</div>
		</div>
	{:else if error}
		<div class="animate-fadeIn px-6 py-4">
			<div class="flex items-center space-x-3 text-red-600">
				<FontAwesomeIcon icon={faExclamationTriangle} />
				<span class="text-sm">{error}</span>
			</div>
		</div>
	{:else if currentUser}
		<div class="animate-fadeIn px-6 py-4">
			<!-- 기본 사용자 정보 표시 -->
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<!-- 사용자 아바타 -->
					<div class="relative">
						{#if getAvatarUrl(currentUser.avatar)}
							<Logo
								src={getAvatarUrl(currentUser.avatar) || '/logo_icon.png'}
								alt={getDisplayName(currentUser) + ' 프로필 이미지'}
								size="sm"
								fallbackSrc="/logo_icon.png"
								className="rounded-full border border-gray-200 object-cover"
							/>
						{:else}
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-medium text-gray-700"
								aria-hidden="true"
							>
								{(() => {
									const name = (getDisplayName(currentUser) || '').trim();
									if (!name) return '';
									const parts = name.split(/\s+/).filter(Boolean);
									if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
									return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
								})()}
							</div>
						{/if}

						{#if currentUser.isActive}
							<div
								class="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400"
								title="활성 계정"
							></div>
						{/if}
					</div>

					<!-- 사용자 정보 -->
					<div class="flex-1">
						<div class="flex items-center space-x-2">
							<p class="text-sm font-medium text-gray-900">
								{getDisplayName(currentUser)}
							</p>
							{#if currentUser.isTwoFactorEnabled}
								<FontAwesomeIcon
									icon={faShieldAlt}
									class="text-green-600"
									title="2단계 인증 활성화됨"
								/>
							{/if}
							{#if !currentUser.isEmailVerified}
								<FontAwesomeIcon
									icon={faExclamationTriangle}
									class="text-amber-500"
									title="이메일 미인증"
								/>
							{/if}
						</div>
						<p class="text-xs text-gray-600">{currentUser.email}</p>
					</div>
				</div>

				<!-- 컴팩트 모드 액션 버튼 -->
				<div class="flex space-x-1">
					<button
						onclick={handleSwitchAccount}
						class="rounded-md bg-stone-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none"
						title="다른 계정으로 로그인"
					>
						<FontAwesomeIcon icon={faRepeat} class="mr-1" />
						계정 전환
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- 로그인되지 않은 상태 -->
		<div class="animate-fadeIn px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
						<FontAwesomeIcon icon={faUser} class="text-gray-400" />
					</div>
					<div>
						<p class="text-sm font-medium text-gray-900">로그인이 필요합니다</p>
						<p class="text-xs text-gray-600">계속하려면 로그인해주세요</p>
					</div>
				</div>
				<button
					onclick={handleSwitchAccount}
					class="rounded-md bg-neutral-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:outline-none"
				>
					<FontAwesomeIcon icon={faSignInAlt} class="mr-1" />
					로그인
				</button>
			</div>
		</div>
	{/if}
</div>
