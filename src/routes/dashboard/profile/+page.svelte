<script lang="ts">
	import { Card, Button, Input, Badge, Loading, Modal } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	// 프로필 편집 상태
	let isEditing = $state(false);
	let editForm = $state({
		firstName: '',
		lastName: '',
		email: '',
		username: ''
	});

	// 비밀번호 변경 모달
	let showPasswordModal = $state(false);
	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	// 로딩 상태
	let isUpdating = $state(false);
	let isChangingPassword = $state(false);

	const toast = useToast();

	onMount(async () => {
		await authStore.initialize();

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;

			// 사용자 정보가 로드되면 편집 폼 초기화
			if (user) {
				resetEditForm();
			}
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 인증 상태에 따른 리다이렉트 처리
	$effect(() => {
		if (!isLoading && !isAuthenticated) {
			window.location.href = '/auth/login';
		}
	});

	function resetEditForm() {
		if (user) {
			editForm = {
				firstName: user.firstName || '',
				lastName: user.lastName || '',
				email: user.email || '',
				username: user.username || ''
			};
		}
	}

	function startEditing() {
		resetEditForm();
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		resetEditForm();
	}

	async function saveProfile() {
		if (!user) return;

		isUpdating = true;
		try {
			// TODO: API 호출로 프로필 업데이트
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 사용자 정보 업데이트 (임시)
			user = {
				...user,
				firstName: editForm.firstName,
				lastName: editForm.lastName,
				email: editForm.email,
				username: editForm.username
			};

			toast.success('프로필이 성공적으로 업데이트되었습니다.');
			isEditing = false;
		} catch (error) {
			console.error('Failed to update profile:', error);
			toast.error('프로필 업데이트에 실패했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	function openPasswordModal() {
		passwordForm = {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		};
		showPasswordModal = true;
	}

	function closePasswordModal() {
		showPasswordModal = false;
		passwordForm = {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		};
	}

	async function changePassword() {
		// 폼 검증
		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			toast.error('모든 필드를 입력해주세요.');
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error('새 비밀번호가 일치하지 않습니다.');
			return;
		}

		if (passwordForm.newPassword.length < 8) {
			toast.error('새 비밀번호는 8자 이상이어야 합니다.');
			return;
		}

		isChangingPassword = true;
		try {
			// TODO: API 호출로 비밀번호 변경
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			toast.success('비밀번호가 성공적으로 변경되었습니다.');
			closePasswordModal();
		} catch (error) {
			console.error('Failed to change password:', error);
			toast.error('비밀번호 변경에 실패했습니다.');
		} finally {
			isChangingPassword = false;
		}
	}

	function navigateBack() {
		window.location.href = '/dashboard';
	}

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	// 키보드 이벤트 핸들러
	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<svelte:head>
	<title>프로필 관리 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="프로필을 불러오는 중..." />
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={navigateBack}
							class="text-gray-600 hover:text-gray-900"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							대시보드로
						</Button>
						<div class="h-6 w-px bg-gray-300"></div>
						<h1 class="text-xl font-semibold text-gray-900">프로필 관리</h1>
					</div>
					<div class="flex items-center space-x-4">
						<div class="hidden sm:block">
							<span class="text-sm text-gray-600">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={handleLogout}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-sign-out-alt mr-2"></i>
							로그아웃
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 프로필 개요 카드 -->
				<Card class="border-l-4 border-l-blue-500">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
								{user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
							</div>
							<div>
								<h2 class="text-2xl font-bold text-gray-900">
									{user.firstName} {user.lastName}
								</h2>
								<p class="text-gray-600">{user.email}</p>
								<div class="mt-1">
									<Badge variant="info" size="sm">
										user
									</Badge>
								</div>
							</div>
						</div>
						{#if !isEditing}
							<Button variant="outline" onclick={startEditing}>
								<i class="fas fa-edit mr-2"></i>
								편집
							</Button>
						{/if}
					</div>
				</Card>

				<!-- 기본 정보 카드 -->
				<Card>
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-lg font-semibold text-gray-900">기본 정보</h3>
						{#if isEditing}
							<div class="flex space-x-2">
								<Button variant="outline" onclick={cancelEditing} disabled={isUpdating}>
									취소
								</Button>
								<Button onclick={saveProfile} disabled={isUpdating}>
									{#if isUpdating}
										<Loading variant="spinner" size="sm" class="mr-2" />
									{:else}
										<i class="fas fa-save mr-2"></i>
									{/if}
									저장
								</Button>
							</div>
						{/if}
					</div>

					{#if isEditing}
						<!-- 편집 모드 -->
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div>
								<label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
									이름
								</label>
								<Input
									id="firstName"
									value={editForm.firstName}
									placeholder="이름을 입력하세요"
									disabled={isUpdating}
									oninput={(e) => {
										editForm.firstName = (e.target as HTMLInputElement).value;
									}}
								/>
							</div>
							<div>
								<label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
									성
								</label>
								<Input
									id="lastName"
									value={editForm.lastName}
									placeholder="성을 입력하세요"
									disabled={isUpdating}
									oninput={(e) => {
										editForm.lastName = (e.target as HTMLInputElement).value;
									}}
								/>
							</div>
							<div>
								<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
									사용자명
								</label>
								<Input
									id="username"
									value={editForm.username}
									placeholder="사용자명을 입력하세요"
									disabled={isUpdating}
									oninput={(e) => {
										editForm.username = (e.target as HTMLInputElement).value;
									}}
								/>
							</div>
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
									이메일
								</label>
								<Input
									id="email"
									type="email"
									value={editForm.email}
									placeholder="이메일을 입력하세요"
									disabled={isUpdating}
									oninput={(e) => {
										editForm.email = (e.target as HTMLInputElement).value;
									}}
								/>
							</div>
						</div>
					{:else}
						<!-- 보기 모드 -->
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div>
								<div class="block text-sm font-medium text-gray-700 mb-1">이름</div>
								<p class="text-gray-900">{user.firstName || '-'}</p>
							</div>
							<div>
								<div class="block text-sm font-medium text-gray-700 mb-1">성</div>
								<p class="text-gray-900">{user.lastName || '-'}</p>
							</div>
							<div>
								<div class="block text-sm font-medium text-gray-700 mb-1">사용자명</div>
								<p class="text-gray-900">{user.username || '-'}</p>
							</div>
							<div>
								<div class="block text-sm font-medium text-gray-700 mb-1">이메일</div>
								<p class="text-gray-900">{user.email || '-'}</p>
							</div>
						</div>
					{/if}
				</Card>

				<!-- 보안 설정 카드 -->
				<Card>
					<h3 class="mb-6 text-lg font-semibold text-gray-900">보안 설정</h3>
					<div class="space-y-4">
						<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
							<div class="flex items-center space-x-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
									<i class="fas fa-lock text-yellow-600"></i>
								</div>
								<div>
									<p class="font-medium text-gray-900">비밀번호</p>
									<p class="text-sm text-gray-600">계정 보안을 위해 정기적으로 비밀번호를 변경하세요</p>
								</div>
							</div>
							<Button variant="outline" onclick={openPasswordModal}>
								<i class="fas fa-key mr-2"></i>
								변경
							</Button>
						</div>

						<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
							<div class="flex items-center space-x-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
									<i class="fas fa-shield-alt text-green-600"></i>
								</div>
								<div>
									<p class="font-medium text-gray-900">이중 인증 (2FA)</p>
									<p class="text-sm text-gray-600">추가 보안을 위한 이중 인증 설정</p>
								</div>
							</div>
							<Badge variant="warning" size="sm">준비 중</Badge>
						</div>

						<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
							<div class="flex items-center space-x-3">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
									<i class="fas fa-mobile-alt text-blue-600"></i>
								</div>
								<div>
									<p class="font-medium text-gray-900">로그인 알림</p>
									<p class="text-sm text-gray-600">새로운 기기에서 로그인 시 알림 받기</p>
								</div>
							</div>
							<Badge variant="success" size="sm">활성화</Badge>
						</div>
					</div>
				</Card>

				<!-- 계정 통계 카드 -->
				<Card>
					<h3 class="mb-6 text-lg font-semibold text-gray-900">계정 통계</h3>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-600">3</div>
							<p class="text-sm text-gray-600">등록된 클라이언트</p>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-green-600">7</div>
							<p class="text-sm text-gray-600">활성 토큰</p>
						</div>
						<div class="text-center">
							<div class="text-2xl font-bold text-purple-600">2</div>
							<p class="text-sm text-gray-600">최근 30일 로그인</p>
						</div>
					</div>
				</Card>

				<!-- 위험 구역 카드 -->
				<Card class="border-l-4 border-l-red-500">
					<h3 class="mb-4 text-lg font-semibold text-red-600">위험 구역</h3>
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-gray-900">계정 비활성화</p>
								<p class="text-sm text-gray-600">계정을 일시적으로 비활성화합니다</p>
							</div>
							<Button variant="outline" disabled>
								비활성화
							</Button>
						</div>
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-gray-900">계정 삭제</p>
								<p class="text-sm text-gray-600">계정과 모든 데이터를 영구적으로 삭제합니다</p>
							</div>
							<Button variant="outline" disabled>
								삭제
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</main>
	</div>

	<!-- 비밀번호 변경 모달 -->
	{#if showPasswordModal}
		<Modal
			title="비밀번호 변경"
			open={showPasswordModal}
			onClose={closePasswordModal}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div>
						<label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
							현재 비밀번호
						</label>
						<Input
							id="currentPassword"
							type="password"
							value={passwordForm.currentPassword}
							placeholder="현재 비밀번호를 입력하세요"
							disabled={isChangingPassword}
							oninput={(e) => {
								passwordForm.currentPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
							새 비밀번호
						</label>
						<Input
							id="newPassword"
							type="password"
							value={passwordForm.newPassword}
							placeholder="새 비밀번호를 입력하세요 (8자 이상)"
							disabled={isChangingPassword}
							oninput={(e) => {
								passwordForm.newPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
							새 비밀번호 확인
						</label>
						<Input
							id="confirmPassword"
							type="password"
							value={passwordForm.confirmPassword}
							placeholder="새 비밀번호를 다시 입력하세요"
							disabled={isChangingPassword}
							oninput={(e) => {
								passwordForm.confirmPassword = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={closePasswordModal} disabled={isChangingPassword}>
					취소
				</Button>
				<Button onclick={changePassword} disabled={isChangingPassword}>
					{#if isChangingPassword}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-save mr-2"></i>
					{/if}
					변경
				</Button>
			{/snippet}
		</Modal>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<Card class="w-full max-w-md">
			<div class="text-center">
				<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인증 필요</h2>
				<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
				<Button onclick={() => (window.location.href = '/auth/login')}>
					로그인하기
				</Button>
			</div>
		</Card>
	</div>
{/if}