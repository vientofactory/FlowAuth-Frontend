<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { User } from '$lib';

	let user = $state<User | null>(null);
	let isLoading = $state(true);

	// 프로필 편집 상태
	let isEditing = $state(false);
	let editForm = $state({
		firstName: '',
		lastName: ''
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

	const toast = useToast();

	onMount(() => {
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;

			// 사용자 정보가 로드되면 편집 폼 초기화
			if (user) {
				resetEditForm();
			}
		});

		return () => {
			unsubscribe();
		};
	});

	function resetEditForm() {
		if (user) {
			editForm = {
				firstName: user.firstName,
				lastName: user.lastName
			};
		}
	}

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			resetEditForm();
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
		if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
			toast.error('이름을 입력해주세요.');
			return;
		}

		isUpdating = true;
		try {
			await apiClient.updateProfile({
				firstName: editForm.firstName,
				lastName: editForm.lastName
			});

			// 업데이트된 사용자 정보를 다시 가져오기
			const updatedUser = await apiClient.getProfile();
			authState.update((state) => ({ ...state, user: updatedUser }));

			toast.success('프로필이 성공적으로 업데이트되었습니다.');
			isEditing = false;
		} catch (error) {
			console.error('Failed to update profile:', error);
			toast.error('프로필 업데이트에 실패했습니다.');
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
	{#snippet children()}
		{#if user}
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- 프로필 정보 -->
				<div class="lg:col-span-2">
					<Card>
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">기본 정보</h3>
							<Button variant="outline" onclick={toggleEdit}>
								{#if isEditing}
									<i class="fas fa-times mr-2"></i>
									취소
								{:else}
									<i class="fas fa-edit mr-2"></i>
									편집
								{/if}
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
										<label class="block text-sm font-medium text-gray-700">이름 *</label>
										<input
											type="text"
											bind:value={editForm.firstName}
											required
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700">성 *</label>
										<input
											type="text"
											bind:value={editForm.lastName}
											required
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700">사용자명</label>
										<input
											type="text"
											bind:value={editForm.username}
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700">이메일 *</label>
										<input
											type="email"
											bind:value={editForm.email}
											required
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
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
									<label class="block text-sm font-medium text-gray-500">이름</label>
									<p class="mt-1 text-sm text-gray-900">{user.firstName}</p>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-500">성</label>
									<p class="mt-1 text-sm text-gray-900">{user.lastName}</p>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-500">사용자명</label>
									<p class="mt-1 text-sm text-gray-900">{user.username}</p>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-500">이메일</label>
									<p class="mt-1 text-sm text-gray-900">{user.email}</p>
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
										<label class="block text-sm font-medium text-gray-700">현재 비밀번호 *</label>
										<input
											type="password"
											bind:value={passwordForm.currentPassword}
											required
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700">새 비밀번호 *</label>
										<input
											type="password"
											bind:value={passwordForm.newPassword}
											required
											minlength="8"
											class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										/>
										<p class="mt-1 text-xs text-gray-500">최소 8자 이상 입력해주세요.</p>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700">새 비밀번호 확인 *</label
										>
										<input
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
								<Badge variant="info" size="sm">관리자</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">2FA</span>
								<Badge variant="secondary" size="sm">비활성</Badge>
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
								<p class="text-sm text-gray-900">2024년 1월 15일</p>
							</div>
							<div>
								<span class="text-sm text-gray-600">마지막 로그인</span>
								<p class="text-sm text-gray-900">방금 전</p>
							</div>
						</div>
					</Card>

					<!-- 보안 설정 -->
					<Card>
						<h3 class="mb-4 text-lg font-medium text-gray-900">보안 설정</h3>
						<div class="space-y-3">
							<Button variant="outline" class="w-full justify-start">
								<i class="fas fa-mobile-alt mr-2"></i>
								2단계 인증 설정
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
	{/snippet}
</DashboardLayout>
