<script lang="ts">
	import { Button } from '$lib';
	import { env } from '$lib/config/env';
	import type { User } from '$lib';

	interface Props {
		user: User;
		selectedAvatarFile: File | null;
		avatarPreview: string | null;
		isUploadingAvatar: boolean;
		isRemovingAvatar: boolean;
		onFileSelect: (event: Event) => void;
		onUpload: () => Promise<void>;
		onCancel: () => void;
		onRemoveDialogOpen: () => void;
	}

	let {
		user,
		selectedAvatarFile,
		avatarPreview,
		isUploadingAvatar,
		isRemovingAvatar,
		onFileSelect,
		onUpload,
		onCancel,
		onRemoveDialogOpen
	}: Props = $props();
</script>

<div class="mb-6">
	<h4 class="mb-3 block text-sm font-medium text-gray-700">프로필 사진</h4>
	<div class="flex items-center space-x-4">
		<!-- 현재 아바타 표시 -->
		<div class="relative">
			{#if avatarPreview}
				<img
					src={avatarPreview}
					alt="아바타 미리보기"
					class="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
				/>
			{:else if user.avatar}
				<img
					src={user.avatar.startsWith('http') ? user.avatar : `${env.API_BASE_URL}${user.avatar}`}
					alt="프로필 사진"
					class="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
				/>
			{:else}
				<div
					class="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-200"
				>
					<i class="fas fa-user text-2xl text-gray-400"></i>
				</div>
			{/if}
		</div>

		<!-- 파일 선택 및 업로드 버튼 -->
		<div class="flex flex-col space-y-2">
			<input
				id="avatar-input"
				type="file"
				accept="image/*"
				onchange={onFileSelect}
				class="hidden"
			/>
			<Button
				variant="outline"
				onclick={() => document.getElementById('avatar-input')?.click()}
				disabled={isUploadingAvatar}
				class="h-10"
			>
				<i class="fas fa-camera mr-2"></i>
				사진 선택
			</Button>

			{#if user.avatar && !selectedAvatarFile && !avatarPreview}
				<Button
					variant="outline"
					onclick={onRemoveDialogOpen}
					disabled={isRemovingAvatar}
					class="h-10 text-red-600 hover:bg-red-50 hover:text-red-700"
				>
					{#if isRemovingAvatar}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						제거 중...
					{:else}
						<i class="fas fa-trash mr-2"></i>
						사진 제거
					{/if}
				</Button>
			{/if}

			{#if selectedAvatarFile || avatarPreview}
				<div class="flex space-x-2">
					<Button onclick={onUpload} disabled={isUploadingAvatar} class="h-10">
						{#if isUploadingAvatar}
							<i class="fas fa-spinner fa-spin mr-2"></i>
							업로드 중...
						{:else}
							<i class="fas fa-upload mr-2"></i>
							업로드
						{/if}
					</Button>
					<Button variant="outline" onclick={onCancel} disabled={isUploadingAvatar} class="h-10">
						취소
					</Button>
				</div>
			{/if}
		</div>
	</div>

	{#if selectedAvatarFile}
		<p class="mt-2 text-sm text-gray-600">
			선택된 파일: {selectedAvatarFile.name} ({(selectedAvatarFile.size / 1024 / 1024).toFixed(2)} MB)
		</p>
	{/if}
</div>
