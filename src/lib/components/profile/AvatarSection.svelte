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
		showRemoveAvatarDialog: boolean;
		onFileSelect: (event: Event) => void;
		onUpload: () => Promise<void>;
		onCancel: () => void;
		onRemoveDialogOpen: () => void;
		onRemoveDialogClose: () => void;
		onRemoveAvatar: () => Promise<void>;
	}

	let {
		user,
		selectedAvatarFile,
		avatarPreview,
		isUploadingAvatar,
		isRemovingAvatar,
		showRemoveAvatarDialog: _showRemoveAvatarDialog,
		onFileSelect,
		onUpload,
		onCancel,
		onRemoveDialogOpen,
		onRemoveDialogClose,
		onRemoveAvatar
	}: Props = $props();

	// 다이얼로그 이벤트 핸들러
	function handleDialogClick(event: MouseEvent) {
		// 다이얼로그 배경을 클릭한 경우에만 닫기
		if (event.target === event.currentTarget) {
			onRemoveDialogClose();
		}
	}

	function handleDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onRemoveDialogClose();
		}
	}
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

<!-- 아바타 제거 확인 다이얼로그 -->
{#if _showRemoveAvatarDialog}
	<div
		class="modal-overlay fixed inset-0 z-50 flex items-center justify-center"
		onclick={handleDialogClick}
		onkeydown={handleDialogKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="remove-avatar-title"
		tabindex="-1"
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" role="document">
			<div class="mb-4 flex items-center">
				<div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
					<i class="fas fa-exclamation-triangle text-red-600"></i>
				</div>
				<h3 id="remove-avatar-title" class="text-lg font-medium text-gray-900">아바타 제거</h3>
			</div>

			<p class="mb-6 text-sm text-gray-500">
				정말로 프로필 사진을 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</p>

			<div class="flex justify-end space-x-3">
				<Button
					variant="outline"
					onclick={onRemoveDialogClose}
					disabled={isRemovingAvatar}
					class="h-10"
				>
					취소
				</Button>
				<Button variant="danger" onclick={onRemoveAvatar} disabled={isRemovingAvatar} class="h-10">
					{#if isRemovingAvatar}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						제거 중...
					{:else}
						<i class="fas fa-trash mr-2"></i>
						제거
					{/if}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
	}

	.modal-overlay:focus {
		outline: none;
	}

	/* 다이얼로그 내부 클릭 시 이벤트 전파 방지 */
	.modal-overlay .w-full {
		pointer-events: auto;
	}

	.modal-overlay {
		pointer-events: auto;
	}
</style>
