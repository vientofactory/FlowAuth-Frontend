<script lang="ts">
	import { Button, Loading } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faUserCircle, faUser } from '@fortawesome/free-solid-svg-icons';

	interface UserProfile {
		sub: string;
		email?: string;
		username?: string;
		roles?: string[];
	}

	interface Props {
		userProfile: UserProfile | null;
		isTestingToken: boolean;
		onFetchUserProfile: () => void;
	}

	let { userProfile, isTestingToken, onFetchUserProfile }: Props = $props();
</script>

<div class="space-y-4">
	{#if userProfile}
		<div class="space-y-3">
			<div class="grid grid-cols-2 gap-4">
				{#if userProfile.sub}
					<div>
						<div class="mb-1 text-sm font-medium text-gray-700">User ID</div>
						<div class="text-sm text-gray-900">{userProfile.sub}</div>
					</div>
				{/if}
				{#if userProfile.email}
					<div>
						<div class="mb-1 text-sm font-medium text-gray-700">Email</div>
						<div class="text-sm text-gray-900">{userProfile.email}</div>
					</div>
				{/if}
				{#if userProfile.username}
					<div>
						<div class="mb-1 text-sm font-medium text-gray-700">Username</div>
						<div class="text-sm text-gray-900">{userProfile.username}</div>
					</div>
				{/if}
				{#if userProfile.roles && userProfile.roles.length > 0}
					<div>
						<div class="mb-1 text-sm font-medium text-gray-700">Roles</div>
						<div class="text-sm text-gray-900">{userProfile.roles.join(', ')}</div>
					</div>
				{/if}
			</div>

			<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
				<div class="mb-1 text-sm font-medium text-gray-700">전체 응답</div>
				<pre class="text-xs text-gray-800">{JSON.stringify(userProfile, null, 2)}</pre>
			</div>
		</div>
	{:else}
		<div class="py-8 text-center">
			<FontAwesomeIcon icon={faUserCircle} class="mb-4 text-4xl text-gray-400" />
			<p class="mb-4 text-gray-500">
				프로필 정보를 가져오려면 "프로필 가져오기" 버튼을 클릭하세요.
			</p>
			<Button onclick={onFetchUserProfile} disabled={isTestingToken}>
				{#if isTestingToken}
					<Loading variant="spinner" size="sm" class="mr-2" />
					프로필 가져오는 중...
				{:else}
					<FontAwesomeIcon icon={faUser} class="mr-2" />
					프로필 가져오기
				{/if}
			</Button>
		</div>
	{/if}
</div>
