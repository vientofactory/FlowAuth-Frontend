<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient, twoFactorStore } from '$lib';
	import { authState, useToast } from '$lib';
	import { PermissionUtils } from '$lib';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { User } from '$lib';
	import type { TwoFactorStatus } from '$lib/types/2fa.types';
	import type { TwoFactorState } from '$lib/stores/2fa';

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
	let editForm = $state({
		firstName: '',
		lastName: '',
		username: '' // 백엔드에서 이제 지원
		// email: '' // 여전히 지원하지 않음
	});

	// 비밀번호 변경
	let showPasswordForm = $state(false);
	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	// 로딩 상태
	let isUpdating = $state(false);
	let isChangingPassword = $state(false);

	// 2FA 비활성화
	let showDisableTwoFactorDialog = $state(false);
	let disableTwoFactorForm = $state({
		currentPassword: ''
	});
	let isDisablingTwoFactor = $state(false);

	// 사용자명 검증 상태
	let usernameStatus = $state({
		isChecking: false,
		isAvailable: null as boolean | null,
		message: ''
	});
	let usernameCheckTimeout: number | null = $state(null);

	const toast = useToast();

	function resetUsernameStatus() {
		usernameStatus = {
			isChecking: false,
			isAvailable: null,
			message: ''
		};
	}

	onMount(() => {
		loadProfile();

		// authState 변경 감지를 위한 구독 (업데이트 후 동기화용)
		const unsubscribe = authState.subscribe((state) => {
			if (state.user && !user) {
				// 초기 로딩 시 authState에서 사용자 정보가 있다면 사용
				user = state.user;
				resetEditForm();
			}
		});

		return () => {
			unsubscribe();
			// 타이머 정리
			if (usernameCheckTimeout) {
				clearTimeout(usernameCheckTimeout);
			}
		};
	});

	async function loadProfile() {
		try {
			_isLoading = true;
			user = await apiClient.getProfile();
			resetEditForm();
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

	function resetEditForm() {
		if (user) {
			editForm = {
				firstName: user.firstName || '',
				lastName: user.lastName || '',
				username: user.username || ''
			};
		}
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
	}

	function closeDisableTwoFactorDialog() {
		showDisableTwoFactorDialog = false;
		disableTwoFactorForm.currentPassword = '';
	}

	async function checkUsernameAvailability(username: string) {
		if (!username.trim()) {
			resetUsernameStatus();
			return;
		}

		// 현재 사용자명과 같으면 체크하지 않음
		if (user && username.trim() === user.username) {
			resetUsernameStatus();
			return;
		}

		usernameStatus.isChecking = true;
		usernameStatus.message = '확인 중...';

		try {
			const result = await apiClient.checkUsername(username.trim());
			usernameStatus = {
				isChecking: false,
				isAvailable: result.available,
				message: result.message
			};
		} catch (error) {
			console.error('Username check failed:', error);
			usernameStatus = {
				isChecking: false,
				isAvailable: false,
				message: '사용자명 확인에 실패했습니다.'
			};
		}
	}

	function handleUsernameInput() {
		// 이전 타이머 취소
		if (usernameCheckTimeout) {
			clearTimeout(usernameCheckTimeout);
		}

		// 500ms 후에 중복 체크 실행
		usernameCheckTimeout = setTimeout(() => {
			checkUsernameAvailability(editForm.username);
		}, 500);
	}

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			resetEditForm();
			resetUsernameStatus();
		}
	}

	function togglePasswordForm() {
		showPasswordForm = !showPasswordForm;
		if (!showPasswordForm) {
			passwordForm = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
		}
	}

	async function updateProfile() {
		// 입력 검증
		if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
			toast.error('이름을 입력해주세요.');
			return;
		}

		if (!editForm.username.trim()) {
			toast.error('사용자명을 입력해주세요.');
			return;
		}

		// 사용자명 유효성 검사
		if (editForm.username.length < 3) {
			toast.error('사용자명은 최소 3자 이상이어야 합니다.');
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(editForm.username)) {
			toast.error('사용자명은 영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.');
			return;
		}

		// Username 중복 체크 상태 확인
		if (usernameStatus.isChecking) {
			toast.info('사용자명 확인 중입니다. 잠시만 기다려주세요.');
			return;
		}

		if (usernameStatus.isAvailable === false) {
			toast.error(usernameStatus.message || '사용할 수 없는 사용자명입니다.');
			return;
		}

		// 변경사항 확인
		if (
			user &&
			editForm.firstName === user.firstName &&
			editForm.lastName === user.lastName &&
			editForm.username === user.username
		) {
			toast.info('변경된 내용이 없습니다.');
			isEditing = false;
			return;
		}

		isUpdating = true;
		try {
			// API 호출
			const updatedUser = await apiClient.updateProfile({
				firstName: editForm.firstName.trim(),
				lastName: editForm.lastName.trim(),
				username: editForm.username.trim()
			}) as User;

			// 로컬 상태 업데이트
			user = updatedUser;
			authState.update((state) => ({ ...state, user: updatedUser }));

			toast.success('프로필이 성공적으로 업데이트되었습니다.');
			isEditing = false;
		} catch (error) {
			console.error('Failed to update profile:', error);

			// 구체적인 에러 메시지 처리
			if (error instanceof Error) {
				if (error.message.includes('401')) {
					toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
				} else if (error.message.includes('403')) {
					toast.error('프로필 수정 권한이 없습니다.');
				} else if (error.message.includes('400')) {
					toast.error('입력 데이터가 올바르지 않습니다.');
				} else {
					toast.error('프로필 업데이트에 실패했습니다.');
				}
			} else {
				toast.error('알 수 없는 오류가 발생했습니다.');
			}
		} finally {
			isUpdating = false;
		}
	}

	async function changePassword() {
		if (
			!passwordForm.currentPassword ||
			!passwordForm.newPassword ||
			!passwordForm.confirmPassword
		) {
			toast.error('모든 필드를 입력해주세요.');
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error('새 비밀번호가 일치하지 않습니다.');
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			toast.error('비밀번호는 최소 8자 이상이어야 합니다.');
			return;
		}

		isChangingPassword = true;
		try {
			await apiClient.changePassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword
			});

			toast.success('비밀번호가 성공적으로 변경되었습니다.');
			togglePasswordForm();
		} catch (error) {
			console.error('Failed to change password:', error);
			toast.error('비밀번호 변경에 실패했습니다.');
		} finally {
			isChangingPassword = false;
		}
	}
</script>

<DashboardLayout
	title="프로필"
	description="개인 정보와 계정 설정을 관리하세요."
	showBackButton={true}
>
	{#if user}
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

					{#if isEditing}
						<!-- 편집 폼 -->
						<form
							onsubmit={(e) => {
								e.preventDefault();
								updateProfile();
							}}
						>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label for="profile-firstname" class="block text-sm font-medium text-gray-700"
										>이름 *</label
									>
									<input
										id="profile-firstname"
										type="text"
										bind:value={editForm.firstName}
										required
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label for="profile-lastname" class="block text-sm font-medium text-gray-700"
										>성 *</label
									>
									<input
										id="profile-lastname"
										type="text"
										bind:value={editForm.lastName}
										required
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>

								<div class="sm:col-span-2">
									<label for="profile-username" class="block text-sm font-medium text-gray-700"
										>사용자명 *</label
									>
									<div class="relative">
										<input
											id="profile-username"
											type="text"
											bind:value={editForm.username}
											oninput={handleUsernameInput}
											required
											minlength="3"
											pattern="^[a-zA-Z0-9_-]+$"
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
											class:border-green-500={usernameStatus.isAvailable === true}
											class:border-red-500={usernameStatus.isAvailable === false}
										/>
										{#if usernameStatus.isChecking}
											<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
												<i class="fas fa-spinner fa-spin text-gray-400"></i>
											</div>
										{:else if usernameStatus.isAvailable === true}
											<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
												<i class="fas fa-check text-green-500"></i>
											</div>
										{:else if usernameStatus.isAvailable === false}
											<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
												<i class="fas fa-times text-red-500"></i>
											</div>
										{/if}
									</div>
									{#if usernameStatus.message}
										<p class={`mt-1 text-xs ${
											usernameStatus.isAvailable === true
												? 'text-green-600'
												: usernameStatus.isAvailable === false
												? 'text-red-600'
												: 'text-gray-500'
										}`}>
											{usernameStatus.message}
										</p>
									{:else}
										<p class="mt-1 text-xs text-gray-500">
											영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.
										</p>
									{/if}
								</div>
							</div>

							<div class="mt-6 flex justify-end space-x-2">
								<Button variant="outline" onclick={toggleEdit}>취소</Button>
								<Button type="submit" disabled={isUpdating}>
									{#if isUpdating}
										<i class="fas fa-spinner fa-spin mr-2"></i>
										업데이트 중...
									{:else}
										업데이트
									{/if}
								</Button>
							</div>
						</form>
					{:else}
						<!-- 읽기 전용 -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

							<!-- API에서 업데이트 지원하지 않는 필드들 -->
							<div>
								<h4 class="block text-sm font-medium text-gray-500">이메일</h4>
								<p class="mt-1 text-sm text-gray-900">{user.email}</p>
								<p class="mt-1 text-xs text-gray-400">수정 불가</p>
							</div>
						</div>
					{/if}
				</Card>

				<!-- 비밀번호 변경 -->
				<Card class="mt-6">
					<div class="mb-6 flex items-center justify-between">
						<h3 class="text-lg font-medium text-gray-900">비밀번호 변경</h3>
						<Button variant="outline" onclick={togglePasswordForm}>
							{#if showPasswordForm}
								<i class="fas fa-times mr-2"></i>
								취소
							{:else}
								<i class="fas fa-key mr-2"></i>
								비밀번호 변경
							{/if}
						</Button>
					</div>

					{#if showPasswordForm}
						<form
							onsubmit={(e) => {
								e.preventDefault();
								changePassword();
							}}
						>
							<div class="space-y-4">
								<div>
									<label for="current-password" class="block text-sm font-medium text-gray-700"
										>현재 비밀번호 *</label
									>
									<input
										id="current-password"
										type="password"
										bind:value={passwordForm.currentPassword}
										required
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label for="new-password" class="block text-sm font-medium text-gray-700"
										>새 비밀번호 *</label
									>
									<input
										id="new-password"
										type="password"
										bind:value={passwordForm.newPassword}
										required
										minlength="8"
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
									<p class="mt-1 text-xs text-gray-500">최소 8자 이상 입력해주세요.</p>
								</div>

								<div>
									<label for="confirm-password" class="block text-sm font-medium text-gray-700"
										>새 비밀번호 확인 *</label
									>
									<input
										id="confirm-password"
										type="password"
										bind:value={passwordForm.confirmPassword}
										required
										minlength="8"
										class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div class="mt-6 flex justify-end space-x-2">
								<Button variant="outline" onclick={togglePasswordForm}>취소</Button>
								<Button type="submit" disabled={isChangingPassword}>
									{#if isChangingPassword}
										<i class="fas fa-spinner fa-spin mr-2"></i>
										변경 중...
									{:else}
										비밀번호 변경
									{/if}
								</Button>
							</div>
						</form>
					{:else}
						<div class="py-8 text-center">
							<i class="fas fa-shield-alt mb-4 text-4xl text-gray-400"></i>
							<p class="mb-4 text-gray-500">보안을 위해 주기적으로 비밀번호를 변경하세요.</p>
							<Button onclick={togglePasswordForm}>비밀번호 변경하기</Button>
						</div>
					{/if}
				</Card>
			</div>

			<!-- 사이드바 정보 -->
			<div class="space-y-6">
				<!-- 계정 상태 -->
				<Card>
					<h3 class="mb-4 text-lg font-medium text-gray-900">계정 상태</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">상태</span>
							<Badge variant="success" size="sm">활성</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">역할</span>
							{#if user.permissions !== undefined}
								<Badge variant="info" size="sm">
									{PermissionUtils.getRoleName(parseInt(user.permissions, 10))}
								</Badge>
							{:else}
								<Badge variant="secondary" size="sm">권한 없음</Badge>
							{/if}
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">세부 권한</span>
							{#if user.permissions !== undefined}
								<div class="flex max-w-48 flex-wrap gap-1">
									{#each PermissionUtils.getPermissionNames(parseInt(user.permissions, 10)) as permission (permission)}
										<Badge variant="secondary" size="xs">{permission}</Badge>
									{/each}
								</div>
							{:else}
								<Badge variant="secondary" size="sm">권한 없음</Badge>
							{/if}
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">2FA</span>
							{#if twoFactorState.isLoading}
								<div class="flex items-center space-x-2">
									<i class="fas fa-spinner fa-spin text-gray-400"></i>
									<span class="text-sm text-gray-500">확인 중...</span>
								</div>
							{:else if twoFactorState.status?.enabled}
								<div class="flex items-center space-x-3">
									<div class="flex items-center space-x-2">
										<Badge variant="success" size="sm">활성</Badge>
										{#if twoFactorState.status.hasBackupCodes}
											<span class="text-xs text-green-600">백업 코드 있음</span>
										{:else}
											<span class="text-xs text-yellow-600">백업 코드 필요</span>
										{/if}
									</div>
									<Button
										variant="outline"
										size="xs"
										onclick={openDisableTwoFactorDialog}
										class="text-red-600 hover:text-red-700 hover:bg-red-50"
									>
										비활성화
									</Button>
								</div>
							{:else}
								<div class="flex items-center space-x-2">
									<Badge variant="secondary" size="sm">비활성</Badge>
									<Button
										variant="outline"
										size="xs"
										onclick={goToTwoFactorSetup}
									>
										설정
									</Button>
								</div>
							{/if}
						</div>
					</div>
				</Card>

				<!-- 계정 정보 -->
				<Card>
					<h3 class="mb-4 text-lg font-medium text-gray-900">계정 정보</h3>
					<div class="space-y-3">
						<div>
							<span class="text-sm text-gray-600">사용자 ID</span>
							<p class="text-sm text-gray-900">{user.id}</p>
						</div>
						<div>
							<span class="text-sm text-gray-600">가입일</span>
							<p class="text-sm text-gray-900">
								{user.createdAt
									? new Date(user.createdAt).toLocaleDateString('ko-KR', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})
									: '정보 없음'}
							</p>
						</div>
						<div>
							<span class="text-sm text-gray-600">마지막 로그인</span>
							<p class="text-sm text-gray-900">정보 없음</p>
						</div>
						<div>
							<span class="text-sm text-gray-600">이메일 인증</span>
							<p class="text-sm text-gray-900">
								{user.isEmailVerified ? '인증됨' : '미인증'}
							</p>
						</div>
					</div>
				</Card>

				<!-- 보안 설정 -->
				<Card>
					<h3 class="mb-4 text-lg font-medium text-gray-900">보안 설정</h3>
					<div class="space-y-3">
						<Button variant="outline" class="w-full justify-start" onclick={goToTwoFactorSetup}>
							<i class="fas fa-mobile-alt mr-2"></i>
							{#if twoFactorState.status?.enabled}
								2단계 인증 관리
							{:else}
								2단계 인증 설정
							{/if}
						</Button>
						<Button variant="outline" class="w-full justify-start">
							<i class="fas fa-history mr-2"></i>
							로그인 기록 보기
						</Button>
						<Button variant="outline" class="w-full justify-start">
							<i class="fas fa-download mr-2"></i>
							데이터 내보내기
						</Button>
					</div>
				</Card>

				<!-- 위험 구역 -->
				<Card class="border-red-200">
					<h3 class="mb-4 text-lg font-medium text-red-900">위험 구역</h3>
					<div class="space-y-3">
						<Button
							variant="outline"
							class="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
						>
							<i class="fas fa-sign-out-alt mr-2"></i>
							모든 기기에서 로그아웃
						</Button>
						<Button
							variant="outline"
							class="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
						>
							<i class="fas fa-trash mr-2"></i>
							계정 삭제
						</Button>
					</div>
				</Card>
			</div>
		</div>
	{/if}
</DashboardLayout>

<style>
	/* 2FA 비활성화 모달 스타일 */
	:global(.modal-backdrop) {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	:global(.modal-content) {
		background: white;
		border-radius: 12px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(0, 0, 0, 0.1);
		max-width: 28rem;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		transform: scale(1);
		transition: transform 0.3s ease-out;
	}

	/* 입력 필드 포커스 스타일 개선 */
	:global(.modal-input) {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease-in-out;
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	:global(.modal-input:focus) {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
		outline: none;
	}

	:global(.modal-input:disabled) {
		background-color: #f9fafb;
		cursor: not-allowed;
		opacity: 0.7;
	}

	/* 반응형 디자인 */
	@media (max-width: 640px) {
		:global(.modal-backdrop) {
			padding: 0.5rem;
		}

		:global(.modal-content) {
			max-width: calc(100vw - 1rem);
			margin: 0 auto;
		}
	}
</style>

	<!-- 2FA 비활성화 확인 대화상자 -->
	{#if showDisableTwoFactorDialog}
		<div class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
			<div class="modal-content transform transition-all duration-300 scale-100">
				<div class="p-6">
					<div class="mb-4">
						<h3 class="text-lg font-medium text-gray-900">2FA 비활성화</h3>
						<p class="mt-2 text-sm text-gray-600">
							2단계 인증을 비활성화하시겠습니까? 비활성화 후 계정 보안이 약해질 수 있습니다.
						</p>
					</div>

					<div class="mb-4">
						<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
							현재 비밀번호
						</label>
						<input
							id="currentPassword"
							type="password"
							bind:value={disableTwoFactorForm.currentPassword}
							class="modal-input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
							placeholder="현재 비밀번호를 입력하세요"
							disabled={isDisablingTwoFactor}
						/>
					</div>

					<div class="flex justify-end space-x-3">
						<Button
							variant="outline"
							onclick={closeDisableTwoFactorDialog}
							disabled={isDisablingTwoFactor}
							class="px-4 py-2"
						>
							취소
						</Button>
						<Button
							variant="danger"
							onclick={disableTwoFactor}
							disabled={isDisablingTwoFactor || !disableTwoFactorForm.currentPassword.trim()}
							class="px-4 py-2"
						>
							{#if isDisablingTwoFactor}
								<i class="fas fa-spinner fa-spin mr-2"></i>
								비활성화 중...
							{:else}
								비활성화
							{/if}
						</Button>
					</div>
				</div>
			</div>
		</div>
	{/if}