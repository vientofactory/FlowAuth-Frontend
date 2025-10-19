<script lang="ts">
	import {
		DashboardLayout,
		Card,
		Button,
		apiClient,
		twoFactorStore,
		authState,
		useToast,
		DashboardSkeleton
	} from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
	import type { TwoFactorState } from '$lib/stores/2fa';
	import AvatarSection from '$lib/components/profile/AvatarSection.svelte';
	import AccountSidebar from '$lib/components/profile/AccountSidebar.svelte';
	import ProfileReadOnlyView from '$lib/components/profile/ProfileReadOnlyView.svelte';
	import ProfileEditForm from '$lib/components/profile/ProfileEditForm.svelte';
	import PasswordChangeSection from '$lib/components/profile/PasswordChangeSection.svelte';
	import './+page.css';

	let user = $state<User | null>(null);
	let _isLoading = $state(true);

	// 2FA 스토어 상태
	let twoFactorState = $state<TwoFactorState>({ status: null, isLoading: false, error: null });

	// 2FA 스토어 구독
	$effect(() => {
		const unsubscribe = twoFactorStore.subscribe((state) => {
			twoFactorState = state;
		});
		return unsubscribe;
	});

	// 프로필 편집 상태
	let isEditing = $state(false);

	// 비밀번호 변경
	let showPasswordForm = $state(false);

	// 아바타 업로드
	let selectedAvatarFile = $state<File | null>(null);
	let avatarPreview = $state<string | null>(null);
	let isUploadingAvatar = $state(false);
	let isRemovingAvatar = $state(false);

	// 아바타 제거 확인 모달
	let showRemoveAvatarDialog = $state(false);

	// 2FA 비활성화
	let _showDisableTwoFactorDialog = $state(false);
	let disableTwoFactorForm = $state({
		currentPassword: ''
	});
	let _isDisablingTwoFactor = $state(false);

	const toast = useToast();

	onMount(() => {
		loadProfile();

		// authState 변경 감지를 위한 구독 (업데이트 후 동기화용)
		const unsubscribe = authState.subscribe((state) => {
			if (state.user && !user) {
				// 초기 로딩 시 authState에서 사용자 정보가 있다면 사용
				user = state.user;
			}

			// 디버깅: 프로필 페이지 사용자 정보 로깅
			console.log('Profile: authState updated', {
				user: state.user,
				avatar: state.user?.avatar,
				isAuthenticated: state.isAuthenticated
			});
		});

		return () => {
			unsubscribe();
		};
	});

	async function loadProfile() {
		try {
			_isLoading = true;
			user = await apiClient.getProfile();
			await loadTwoFactorStatus();
		} catch (error) {
			console.error('Failed to load profile:', error);
			toast.error('프로필 정보를 불러오는데 실패했습니다.');
		} finally {
			_isLoading = false;
		}
	}

	async function loadTwoFactorStatus() {
		await twoFactorStore.loadStatus();
	}

	function goToTwoFactorSetup() {
		goto('/auth/2fa/setup');
	}

	async function _disableTwoFactor() {
		if (!disableTwoFactorForm.currentPassword.trim()) {
			toast.error('현재 비밀번호를 입력해주세요.');
			return;
		}

		try {
			_isDisablingTwoFactor = true;
			await twoFactorStore.disableTwoFactor(disableTwoFactorForm.currentPassword);
			toast.success('2FA가 성공적으로 비활성화되었습니다.');
			_showDisableTwoFactorDialog = false;
			disableTwoFactorForm.currentPassword = '';
			await loadTwoFactorStatus(); // 상태 새로고침
		} catch (error) {
			console.error('Failed to disable 2FA:', error);
			toast.error('2FA 비활성화에 실패했습니다.');
		} finally {
			_isDisablingTwoFactor = false;
		}
	}

	function openDisableTwoFactorDialog() {
		_showDisableTwoFactorDialog = true;
		disableTwoFactorForm.currentPassword = '';
	}

	function _closeDisableTwoFactorDialog() {
		_showDisableTwoFactorDialog = false;
		disableTwoFactorForm.currentPassword = '';
	}

	function handleAvatarFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// 파일 유효성 검사
			if (!file.type.startsWith('image/')) {
				toast.error('이미지 파일만 업로드할 수 있습니다.');
				return;
			}

			if (file.size > 1 * 1024 * 1024) {
				// 1MB
				toast.error('파일 크기는 1MB 이하여야 합니다.');
				return;
			}

			selectedAvatarFile = file;

			// 미리보기 생성
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	async function uploadAvatar() {
		if (!selectedAvatarFile) {
			toast.error('업로드할 파일을 선택해주세요.');
			return;
		}

		try {
			isUploadingAvatar = true;

			const formData = new FormData();
			formData.append('avatar', selectedAvatarFile);

			const response = await apiClient.uploadAvatar(formData);

			// 사용자 정보 업데이트
			if (user) {
				user.avatar = response.avatarUrl;
			}

			toast.success('아바타가 성공적으로 업로드되었습니다.');

			// 폼 초기화
			selectedAvatarFile = null;
			avatarPreview = null;
			const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
			if (fileInput) {
				fileInput.value = '';
			}

			// 프로필 다시 로드하여 캐시 업데이트
			await loadProfile();
		} catch (error) {
			console.error('Avatar upload failed:', error);
			toast.error('아바타 업로드에 실패했습니다.');
		} finally {
			isUploadingAvatar = false;
		}
	}

	function cancelAvatarUpload() {
		selectedAvatarFile = null;
		avatarPreview = null;
		const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function openRemoveAvatarDialog() {
		showRemoveAvatarDialog = true;
	}

	function _closeRemoveAvatarDialog() {
		showRemoveAvatarDialog = false;
	}

	async function removeAvatar() {
		try {
			isRemovingAvatar = true;
			await apiClient.removeAvatar();

			// 사용자 정보 업데이트
			if (user) {
				user.avatar = null;
			}

			toast.success('아바타가 성공적으로 제거되었습니다.');
			showRemoveAvatarDialog = false;

			// 프로필 다시 로드하여 캐시 업데이트
			await loadProfile();
		} catch (error) {
			console.error('Avatar removal failed:', error);
			toast.error('아바타 제거에 실패했습니다.');
		} finally {
			isRemovingAvatar = false;
		}
	}

	function toggleEdit() {
		isEditing = !isEditing;
	}

	function togglePasswordForm() {
		showPasswordForm = !showPasswordForm;
	}

	// ProfileEditForm에서 호출될 콜백 함수
	async function handleProfileUpdate(updatedUser: User) {
		user = updatedUser;
		authState.update((state) => ({ ...state, user: updatedUser }));
		isEditing = false;
		toast.success('프로필이 성공적으로 업데이트되었습니다.');
	}

	function handleEditCancel() {
		isEditing = false;
	}

	// 비밀번호 변경 성공 콜백
	function handlePasswordChanged() {
		showPasswordForm = false;
		toast.success('비밀번호가 성공적으로 변경되었습니다.');
	}
</script>

<DashboardLayout
	title="프로필"
	description="개인 정보와 계정 설정을 관리하세요."
	showBackButton={true}
>
	{#if _isLoading}
		<DashboardSkeleton type="profile" />
	{:else if user}
		<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
			<!-- 프로필 정보 -->
			<div class="lg:col-span-2">
				<Card>
					<div
						class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<h3 class="text-base font-medium text-gray-900 sm:text-lg">기본 정보</h3>
						<Button variant="outline" onclick={toggleEdit} class="h-10 w-full sm:h-11 sm:w-auto">
							<i class="fas fa-edit mr-2"></i>
							{isEditing ? '취소' : '편집'}
						</Button>
					</div>

					<!-- 아바타 섹션 -->
					<AvatarSection
						{user}
						{selectedAvatarFile}
						{avatarPreview}
						{isUploadingAvatar}
						{isRemovingAvatar}
						{showRemoveAvatarDialog}
						onFileSelect={handleAvatarFileSelect}
						onUpload={uploadAvatar}
						onCancel={cancelAvatarUpload}
						onRemoveDialogOpen={openRemoveAvatarDialog}
						onRemoveDialogClose={_closeRemoveAvatarDialog}
						onRemoveAvatar={removeAvatar}
					/>

					{#if isEditing}
						<ProfileEditForm {user} onUpdate={handleProfileUpdate} onCancel={handleEditCancel} />
					{:else}
						<ProfileReadOnlyView {user} />
					{/if}
				</Card>

				<!-- 비밀번호 변경 -->
				<div class="mt-6">
					{#if showPasswordForm}
						<PasswordChangeSection onPasswordChanged={handlePasswordChanged} />
						<div class="mt-4">
							<Button variant="outline" onclick={togglePasswordForm} class="w-full">
								<i class="fas fa-times mr-2"></i>
								비밀번호 변경 취소
							</Button>
						</div>
					{:else}
						<Card>
							<div class="mb-6 flex items-center justify-between">
								<h3 class="text-lg font-medium text-gray-900">비밀번호 변경</h3>
								<Button variant="outline" onclick={togglePasswordForm}>
									<i class="fas fa-key mr-2"></i>
									비밀번호 변경
								</Button>
							</div>
							<div class="py-8 text-center">
								<i class="fas fa-shield-alt mb-4 text-4xl text-gray-400"></i>
								<p class="mb-4 text-gray-500">보안을 위해 주기적으로 비밀번호를 변경하세요.</p>
								<Button onclick={togglePasswordForm}>비밀번호 변경하기</Button>
							</div>
						</Card>
					{/if}
				</div>
			</div>

			<!-- 사이드바 정보 -->
			<AccountSidebar
				{user}
				{twoFactorState}
				onDisableTwoFactorDialogOpen={openDisableTwoFactorDialog}
				onGoToTwoFactorSetup={goToTwoFactorSetup}
			/>
		</div>
	{/if}
</DashboardLayout>
