<script lang="ts">
	import type { User } from '$lib';

	interface Props {
		user: User;
	}

	let { user }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
	<!-- 기본 정보 -->
	<div>
		<h4 class="block text-sm font-medium text-gray-500">이름</h4>
		<p class="mt-1 text-sm text-gray-900">{user.firstName}</p>
	</div>

	<div>
		<h4 class="block text-sm font-medium text-gray-500">성</h4>
		<p class="mt-1 text-sm text-gray-900">{user.lastName}</p>
	</div>

	<div>
		<h4 class="block text-sm font-medium text-gray-500">사용자명</h4>
		<p class="mt-1 text-sm text-gray-900">{user.username}</p>
	</div>

	<!-- 추가 프로필 정보 -->
	<div class="sm:col-span-2">
		<h4 class="block text-sm font-medium text-gray-500">소개글</h4>
		<p class="mt-1 text-sm text-gray-900">
			{user.bio || '소개글이 없습니다.'}
		</p>
	</div>

	<div>
		<h4 class="block text-sm font-medium text-gray-500">웹사이트</h4>
		{#if user.website}
			<a
				href={user.website}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-1 text-sm break-all text-blue-600 hover:text-blue-800"
			>
				{user.website}
				<i class="fas fa-external-link-alt ml-1 text-xs"></i>
			</a>
		{:else}
			<p class="mt-1 text-sm text-gray-900">웹사이트가 없습니다.</p>
		{/if}
	</div>

	<div>
		<h4 class="block text-sm font-medium text-gray-500">지역</h4>
		<p class="mt-1 text-sm text-gray-900">
			{user.location || '지역 정보가 없습니다.'}
		</p>
	</div>

	<!-- 수정 불가 필드 -->
	<div>
		<h4 class="block text-sm font-medium text-gray-500">이메일</h4>
		<p class="mt-1 text-sm text-gray-900">{user.email}</p>
		<p class="mt-1 text-xs text-gray-400">수정 불가</p>
	</div>
</div>
