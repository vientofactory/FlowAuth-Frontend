<script lang="ts">
	import { Button, apiClient, useToast } from '$lib';
	import type { User } from '$lib';

	interface Props {
		user: User;
		onUpdate: (user: User) => Promise<void>;
		onCancel: () => void;
	}

	let { user, onUpdate, onCancel }: Props = $props();

	// 폼 상태
	let editForm = $state({
		firstName: user.firstName || '',
		lastName: user.lastName || '',
		username: user.username || '',
		bio: user.bio || '',
		website: user.website || '',
		location: user.location || ''
	});

	// 사용자명 검증 상태
	let usernameStatus = $state({
		isChecking: false,
		isAvailable: null as boolean | null,
		message: ''
	});
	let usernameCheckTimeout: ReturnType<typeof setTimeout> | null = $state(null);

	let isUpdating = $state(false);

	const toast = useToast();

	function resetUsernameStatus() {
		usernameStatus = {
			isChecking: false,
			isAvailable: null,
			message: ''
		};
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

	async function handleSubmit(e: Event) {
		e.preventDefault();

		// 입력 검증
		if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
			toast.error('이름을 입력해주세요.');
			return;
		}

		// 이름, 성 길이 검증
		if (editForm.firstName.length > 100) {
			toast.error('이름은 최대 100자까지 입력할 수 있습니다.');
			return;
		}
		if (editForm.lastName.length > 100) {
			toast.error('성은 최대 100자까지 입력할 수 있습니다.');
			return;
		}

		// 이름, 성 형식 검증
		const namePattern = /^[a-zA-Z가-힣\s\-.']+$/;
		if (!namePattern.test(editForm.firstName.trim())) {
			toast.error('이름은 한글, 영문, 공백, 하이픈, 점, 아포스트로피만 사용할 수 있습니다.');
			return;
		}
		if (!namePattern.test(editForm.lastName.trim())) {
			toast.error('성은 한글, 영문, 공백, 하이픈, 점, 아포스트로피만 사용할 수 있습니다.');
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

		// 소개글 유효성 검사
		if (editForm.bio.length > 500) {
			toast.error('소개글은 최대 500자까지 입력할 수 있습니다.');
			return;
		}

		// 웹사이트 유효성 검사
		if (editForm.website.trim()) {
			if (editForm.website.length > 255) {
				toast.error('웹사이트 URL은 최대 255자까지 입력할 수 있습니다.');
				return;
			}
			try {
				new URL(editForm.website.trim());
			} catch {
				toast.error('올바른 URL 형식이 아닙니다. (예: https://example.com)');
				return;
			}
		}

		// 지역 유효성 검사
		if (editForm.location.length > 100) {
			toast.error('지역은 최대 100자까지 입력할 수 있습니다.');
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
			editForm.username === user.username &&
			editForm.bio === (user.bio || '') &&
			editForm.website === (user.website || '') &&
			editForm.location === (user.location || '')
		) {
			toast.info('변경된 내용이 없습니다.');
			onCancel();
			return;
		}

		isUpdating = true;
		try {
			// API 호출
			const updateData: {
				firstName: string;
				lastName: string;
				username: string;
				bio?: string;
				website?: string;
				location?: string;
			} = {
				firstName: editForm.firstName.trim(),
				lastName: editForm.lastName.trim(),
				username: editForm.username.trim(),
				bio: editForm.bio.trim() || undefined,
				website: editForm.website.trim() || undefined,
				location: editForm.location.trim() || undefined
			};
			const updatedUser = (await apiClient.updateProfile(updateData)) as User;

			await onUpdate(updatedUser);
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
</script>

<form onsubmit={handleSubmit}>
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- 이름 필드 -->
		<div>
			<label for="profile-firstname" class="block text-sm font-medium text-gray-700">이름 *</label>
			<input
				id="profile-firstname"
				type="text"
				bind:value={editForm.firstName}
				required
				maxlength="100"
				pattern="^[a-zA-Z가-힣\s\-.']+$"
				class={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
					editForm.firstName.trim() &&
					(editForm.firstName.length > 100 ||
						!/^[a-zA-Z가-힣\s\-.']+$/.test(editForm.firstName.trim()))
						? 'border-red-500 focus:border-red-500'
						: editForm.firstName.length > 90
							? 'border-yellow-500 focus:border-yellow-500'
							: 'border-gray-300 focus:border-blue-500'
				}`}
			/>
			{#if editForm.firstName.trim() && (editForm.firstName.length > 100 || !/^[a-zA-Z가-힣\s\-.']+$/.test(editForm.firstName.trim()))}
				<p class="mt-1 text-xs text-red-600">
					{#if editForm.firstName.length > 100}
						이름은 최대 100자까지 입력할 수 있습니다. ({editForm.firstName.length}/100)
					{:else}
						한글, 영문, 공백, 하이픈, 점, 아포스트로피만 사용할 수 있습니다.
					{/if}
				</p>
			{:else if editForm.firstName.length > 90}
				<p class="mt-1 text-xs text-yellow-600">
					이름 길이: {editForm.firstName.length}/100
				</p>
			{/if}
		</div>

		<!-- 성 필드 -->
		<div>
			<label for="profile-lastname" class="block text-sm font-medium text-gray-700">성 *</label>
			<input
				id="profile-lastname"
				type="text"
				bind:value={editForm.lastName}
				required
				maxlength="100"
				pattern="^[a-zA-Z가-힣\s\-.']+$"
				class={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
					editForm.lastName.trim() &&
					(editForm.lastName.length > 100 ||
						!/^[a-zA-Z가-힣\s\-.']+$/.test(editForm.lastName.trim()))
						? 'border-red-500 focus:border-red-500'
						: editForm.lastName.length > 90
							? 'border-yellow-500 focus:border-yellow-500'
							: 'border-gray-300 focus:border-blue-500'
				}`}
			/>
			{#if editForm.lastName.trim() && (editForm.lastName.length > 100 || !/^[a-zA-Z가-힣\s\-.']+$/.test(editForm.lastName.trim()))}
				<p class="mt-1 text-xs text-red-600">
					{#if editForm.lastName.length > 100}
						성은 최대 100자까지 입력할 수 있습니다. ({editForm.lastName.length}/100)
					{:else}
						한글, 영문, 공백, 하이픈, 점, 아포스트로피만 사용할 수 있습니다.
					{/if}
				</p>
			{:else if editForm.lastName.length > 90}
				<p class="mt-1 text-xs text-yellow-600">
					성 길이: {editForm.lastName.length}/100
				</p>
			{/if}
		</div>

		<!-- 사용자명 필드 -->
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
					class="mt-1 block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					class:border-green-500={usernameStatus.isAvailable === true}
					class:border-red-500={usernameStatus.isAvailable === false}
				/>
				{#if usernameStatus.isChecking}
					<div class="absolute inset-y-0 right-0 flex items-center pr-3">
						<i class="fas fa-spinner fa-spin text-gray-400"></i>
					</div>
				{:else if usernameStatus.isAvailable === true}
					<div class="absolute inset-y-0 right-0 flex items-center pr-3">
						<i class="fas fa-check text-green-500"></i>
					</div>
				{:else if usernameStatus.isAvailable === false}
					<div class="absolute inset-y-0 right-0 flex items-center pr-3">
						<i class="fas fa-times text-red-500"></i>
					</div>
				{/if}
			</div>
			{#if usernameStatus.message}
				<p
					class={`mt-1 text-xs ${
						usernameStatus.isAvailable === true
							? 'text-green-600'
							: usernameStatus.isAvailable === false
								? 'text-red-600'
								: 'text-gray-500'
					}`}
				>
					{usernameStatus.message}
				</p>
			{:else}
				<p class="mt-1 text-xs text-gray-500">
					영문, 숫자, 하이픈, 언더스코어만 사용할 수 있습니다.
				</p>
			{/if}
		</div>

		<!-- 소개글 필드 -->
		<div class="sm:col-span-2">
			<label for="profile-bio" class="block text-sm font-medium text-gray-700">소개글</label>
			<textarea
				id="profile-bio"
				bind:value={editForm.bio}
				rows="3"
				maxlength="500"
				placeholder="자신을 소개해보세요..."
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
			></textarea>
			<p
				class={`mt-1 text-xs ${
					editForm.bio.length > 500
						? 'text-red-600'
						: editForm.bio.length > 450
							? 'text-yellow-600'
							: 'text-gray-500'
				}`}
			>
				최대 500자까지 입력할 수 있습니다. ({editForm.bio.length}/500)
			</p>
		</div>

		<!-- 웹사이트 필드 -->
		<div>
			<label for="profile-website" class="block text-sm font-medium text-gray-700">웹사이트</label>
			<input
				id="profile-website"
				type="url"
				bind:value={editForm.website}
				maxlength="255"
				placeholder="https://example.com"
				class={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
					(editForm.website.trim() &&
						(() => {
							try {
								new URL(editForm.website.trim());
								return editForm.website.length > 255
									? 'border-red-500 focus:border-red-500'
									: 'border-green-500 focus:border-green-500';
							} catch {
								return 'border-red-500 focus:border-red-500';
							}
						})()) ||
					'border-gray-300 focus:border-blue-500'
				}`}
			/>
			<p
				class={`mt-1 text-xs ${
					(editForm.website.trim() &&
						(() => {
							try {
								new URL(editForm.website.trim());
								return editForm.website.length > 255 ? 'text-red-600' : 'text-green-600';
							} catch {
								return 'text-red-600';
							}
						})()) ||
					'text-gray-500'
				}`}
			>
				{#if editForm.website.trim()}
					{(() => {
						try {
							new URL(editForm.website.trim());
							return editForm.website.length > 255
								? `URL이 너무 깁니다. (${editForm.website.length}/255)`
								: '유효한 URL입니다.';
						} catch {
							return '올바른 URL 형식이 아닙니다. (예: https://example.com)';
						}
					})()}
				{:else}
					개인 웹사이트나 블로그 URL을 입력하세요.
				{/if}
			</p>
		</div>

		<!-- 지역 필드 -->
		<div>
			<label for="profile-location" class="block text-sm font-medium text-gray-700">지역</label>
			<input
				id="profile-location"
				type="text"
				bind:value={editForm.location}
				maxlength="100"
				placeholder="서울, 대한민국"
				class={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
					editForm.location.length > 100
						? 'border-red-500 focus:border-red-500'
						: editForm.location.length > 90
							? 'border-yellow-500 focus:border-yellow-500'
							: 'border-gray-300 focus:border-blue-500'
				}`}
			/>
			<p
				class={`mt-1 text-xs ${
					editForm.location.length > 100
						? 'text-red-600'
						: editForm.location.length > 90
							? 'text-yellow-600'
							: 'text-gray-500'
				}`}
			>
				{#if editForm.location.length > 0}
					거주 지역 ({editForm.location.length}/100)
				{:else}
					거주 지역을 입력하세요.
				{/if}
			</p>
		</div>
	</div>

	<!-- 제출 버튼 -->
	<div class="mt-6 flex justify-end space-x-2">
		<Button variant="outline" onclick={onCancel}>취소</Button>
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
