<script lang="ts">
	import {
		DashboardLayout,
		Card,
		Button,
		Modal,
		apiClient,
		twoFactorStore,
		authState,
		useToast,
		DashboardSkeleton,
		profileStore,
		profileUser,
		isProfileLoading
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

	// 프로필 스토어에서 데이터 가져오기
	let profileUserValue = $state<User | null>(null);
	let _profileLoading = $state(false);

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
	let showDisableTwoFactorDialog = $state(false);
	let disableTwoFactorForm = $state({
		currentPassword: ''
	});
	let isDisablingTwoFactor = $state(false);

	const toast = useToast();

	// 프로필 스토어 구독
	$effect(() => {
		const unsubscribeProfile = profileUser.subscribe((value) => {
			profileUserValue = value;
			// 프로필 스토어에 데이터가 있으면 우선 사용
			if (value) {
				user = value;
				console.log('Profile: Using profile store data', {
					userId: value.id,
					isActive: value.isActive,
					timestamp: new Date().toISOString()
				});
			}
		});

		const unsubscribeLoading = isProfileLoading.subscribe((value) => {
			_profileLoading = value;
			_isLoading = value;
		});

		return () => {
			unsubscribeProfile();
			unsubscribeLoading();
		};
	});

	onMount(() => {
		loadProfile();

		// authState 변경 감지를 위한 구독
		const unsubscribe = authState.subscribe((state) => {
			// 프로필 스토어에 데이터가 없거나 auth에서 새로운 데이터가 온 경우
			if (
				state.user &&
				(!profileUserValue || state.user.updatedAt !== profileUserValue?.updatedAt)
			) {
				// 최신 데이터로 업데이트
				if (!profileUserValue) {
					user = state.user;
					console.log('Profile: Using auth state fallback data', {
						userId: state.user.id,
						isActive: state.user.isActive,
						reason: 'no_profile_data'
					});
				}
			}
		});

		return () => {
			unsubscribe();
		};
	});

	async function loadProfile() {
		try {
			// 페이지 로드 시 항상 최신 데이터 확인
			console.log('Profile: Fetching fresh profile data');
			user = await profileStore.getProfile(true);

			// 2FA 상태도 로드
			await loadTwoFactorStatus();
		} catch (error) {
			console.error('Failed to load profile:', error);
			toast.error('프로필 정보를 불러오는데 실패했습니다.');
		}
	}

	async function loadTwoFactorStatus() {
		await twoFactorStore.loadStatus();
	}

	function goToTwoFactorSetup() {
		goto('/auth/2fa/setup');
	}

	async function disableTwoFactor() {
		if (!disableTwoFactorForm.currentPassword.trim()) {
			toast.error('현재 비밀번호를 입력해주세요.');
			return;
		}

		try {
			isDisablingTwoFactor = true;
			await twoFactorStore.disableTwoFactor(disableTwoFactorForm.currentPassword);
			toast.success('2FA가 성공적으로 비활성화되었습니다.');
			showDisableTwoFactorDialog = false;
			disableTwoFactorForm.currentPassword = '';
			await loadTwoFactorStatus(); // 상태 새로고침
		} catch (error) {
			console.error('Failed to disable 2FA:', error);
			toast.error('2FA 비활성화에 실패했습니다.');
		} finally {
			isDisablingTwoFactor = false;
		}
	}

	function openDisableTwoFactorDialog() {
		showDisableTwoFactorDialog = true;
		disableTwoFactorForm.currentPassword = '';
		// 에러 상태 초기화
		twoFactorStore.clearError();
	}

	function closeDisableTwoFactorDialog() {
		showDisableTwoFactorDialog = false;
		disableTwoFactorForm.currentPassword = '';
		// 에러 상태 초기화
		twoFactorStore.clearError();
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

	function closeRemoveAvatarDialog() {
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
						onRemoveDialogClose={closeRemoveAvatarDialog}
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

		<!-- 2FA 비활성화 모달 -->
		<Modal
			open={showDisableTwoFactorDialog}
			title="2FA 비활성화"
			size="md"
			onClose={closeDisableTwoFactorDialog}
			showFooter={false}
		>
			<div class="mb-4 flex items-center rounded-md bg-yellow-50 p-3">
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
					<i class="fas fa-exclamation-triangle text-yellow-600"></i>
				</div>
				<p class="text-sm text-yellow-800">2단계 인증을 비활성화하면 계정 보안이 약해집니다.</p>
			</div>

			<p class="mb-4 text-sm text-gray-600">계속하려면 현재 비밀번호를 입력해주세요.</p>

			<div class="mb-4">
				<label for="current-password" class="block text-sm font-medium text-gray-700">
					현재 비밀번호
				</label>
				<div class="relative mt-1">
					<input
						id="current-password"
						type="password"
						bind:value={disableTwoFactorForm.currentPassword}
						class="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
						placeholder="현재 비밀번호를 입력하세요"
						disabled={isDisablingTwoFactor}
						onkeydown={(e) => {
							if (
								e.key === 'Enter' &&
								disableTwoFactorForm.currentPassword.trim() &&
								!isDisablingTwoFactor
							) {
								disableTwoFactor();
							}
						}}
					/>
					{#if disableTwoFactorForm.currentPassword.trim()}
						<div class="absolute inset-y-0 right-0 flex items-center pr-3">
							<i class="fas fa-check text-green-500"></i>
						</div>
					{/if}
				</div>
			</div>

			{#if twoFactorState.error}
				<div class="mb-4 rounded-md bg-red-50 p-3">
					<div class="flex">
						<div class="shrink-0">
							<i class="fas fa-exclamation-circle text-red-400"></i>
						</div>
						<div class="ml-3">
							<p class="text-sm text-red-800">{twoFactorState.error}</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
				<Button
					variant="outline"
					onclick={closeDisableTwoFactorDialog}
					class="flex-1"
					disabled={isDisablingTwoFactor}
				>
					취소
				</Button>
				<Button
					variant="danger"
					onclick={disableTwoFactor}
					class="flex-1"
					disabled={isDisablingTwoFactor || !disableTwoFactorForm.currentPassword.trim()}
				>
					{#if isDisablingTwoFactor}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						비활성화 중...
					{:else}
						<i class="fas fa-shield-alt mr-2"></i>
						비활성화
					{/if}
				</Button>
			</div>
		</Modal>
	{/if}
</DashboardLayout>
