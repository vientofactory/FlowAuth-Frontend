<script lang="ts">
	import { apiClient } from '$lib';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);
	let passwordMessage = $state('');
	let passwordMessageType: 'error' | 'success' = $state('error');

	// 비밀번호 검증 함수들
	function validatePassword(password: string) {
		if (password.length < 8) {
			return '비밀번호는 최소 8자 이상이어야 합니다.';
		}
		if (!/(?=.*[a-z])/.test(password)) {
			return '비밀번호에는 소문자가 포함되어야 합니다.';
		}
		if (!/(?=.*[A-Z])/.test(password)) {
			return '비밀번호에는 대문자가 포함되어야 합니다.';
		}
		if (!/(?=.*\d)/.test(password)) {
			return '비밀번호에는 숫자가 포함되어야 합니다.';
		}
		if (!/(?=.*[@$!%*?&])/.test(password)) {
			return '비밀번호에는 특수문자(@$!%*?&)가 포함되어야 합니다.';
		}
		return '';
	}

	function validatePasswordConfirm(password: string, confirmPassword: string) {
		if (password !== confirmPassword) {
			return '비밀번호가 일치하지 않습니다.';
		}
		return '';
	}

	// 실시간 검증 결과
	$effect(() => {
		if (newPassword) {
			const error = validatePassword(newPassword);
			if (error) {
				passwordMessage = error;
				passwordMessageType = 'error';
			} else if (confirmPassword && newPassword !== confirmPassword) {
				passwordMessage = '비밀번호가 일치하지 않습니다.';
				passwordMessageType = 'error';
			} else {
				passwordMessage = '';
			}
		} else {
			passwordMessage = '';
		}
	});

	async function handlePasswordChange() {
		if (!currentPassword || !newPassword || !confirmPassword) {
			passwordMessage = '모든 필드를 입력해주세요.';
			passwordMessageType = 'error';
			return;
		}

		const passwordError = validatePassword(newPassword);
		if (passwordError) {
			passwordMessage = passwordError;
			passwordMessageType = 'error';
			return;
		}

		const confirmError = validatePasswordConfirm(newPassword, confirmPassword);
		if (confirmError) {
			passwordMessage = confirmError;
			passwordMessageType = 'error';
			return;
		}

		isChangingPassword = true;
		passwordMessage = '';

		try {
			const response = (await apiClient.changePassword({
				currentPassword,
				newPassword
			})) as { success: boolean; message?: string };

			if (response.success) {
				passwordMessage = '비밀번호가 성공적으로 변경되었습니다.';
				passwordMessageType = 'success';

				// 폼 초기화
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			} else {
				passwordMessage = response.message || '비밀번호 변경에 실패했습니다.';
				passwordMessageType = 'error';
			}
		} catch (error: unknown) {
			console.error('Password change error:', error);
			passwordMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
			passwordMessageType = 'error';
		} finally {
			isChangingPassword = false;
		}
	}

	// 비밀번호 강도 체크
	function getPasswordStrength(password: string) {
		let score = 0;
		if (password.length >= 8) score++;
		if (/(?=.*[a-z])/.test(password)) score++;
		if (/(?=.*[A-Z])/.test(password)) score++;
		if (/(?=.*\d)/.test(password)) score++;
		if (/(?=.*[@$!%*?&])/.test(password)) score++;

		if (score < 3) return { text: '약함', color: 'text-red-500', bg: 'bg-red-200' };
		if (score < 5) return { text: '보통', color: 'text-yellow-500', bg: 'bg-yellow-200' };
		return { text: '강함', color: 'text-green-500', bg: 'bg-green-200' };
	}

	let passwordStrength = $derived(newPassword ? getPasswordStrength(newPassword) : null);
</script>

<div class="bg-white shadow sm:rounded-lg">
	<div class="px-4 py-5 sm:p-6">
		<h3 class="text-lg leading-6 font-medium text-gray-900">비밀번호 변경</h3>
		<div class="mt-2 max-w-xl text-sm text-gray-500">
			<p>보안을 위해 정기적으로 비밀번호를 변경해주세요.</p>
		</div>

		<div class="mt-5 space-y-4">
			<!-- 현재 비밀번호 -->
			<div>
				<label for="current-password" class="block text-sm font-medium text-gray-700">
					현재 비밀번호
				</label>
				<div class="mt-1">
					<input
						id="current-password"
						name="current-password"
						type="password"
						autocomplete="current-password"
						bind:value={currentPassword}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="현재 비밀번호를 입력하세요"
					/>
				</div>
			</div>

			<!-- 새 비밀번호 -->
			<div>
				<label for="new-password" class="block text-sm font-medium text-gray-700">
					새 비밀번호
				</label>
				<div class="mt-1">
					<input
						id="new-password"
						name="new-password"
						type="password"
						autocomplete="new-password"
						bind:value={newPassword}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="새 비밀번호를 입력하세요"
					/>
				</div>

				<!-- 비밀번호 강도 표시 -->
				{#if newPassword && passwordStrength}
					<div class="mt-2">
						<div class="flex items-center justify-between text-xs">
							<span class={passwordStrength.color}>
								비밀번호 강도: {passwordStrength.text}
							</span>
						</div>
						<div class="mt-1 h-2 w-full rounded-full bg-gray-200">
							<div
								class="{passwordStrength.bg} h-2 rounded-full transition-all duration-300"
								style="width: {passwordStrength.text === '약함'
									? '33%'
									: passwordStrength.text === '보통'
										? '66%'
										: '100%'}"
							></div>
						</div>
					</div>
				{/if}

				<!-- 비밀번호 요구사항 -->
				<div class="mt-2 text-xs text-gray-500">
					<p>비밀번호 요구사항:</p>
					<ul class="mt-1 list-inside list-disc space-y-1">
						<li class={newPassword.length >= 8 ? 'text-green-600' : ''}>최소 8자 이상</li>
						<li class={/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : ''}>소문자 포함</li>
						<li class={/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : ''}>대문자 포함</li>
						<li class={/(?=.*\d)/.test(newPassword) ? 'text-green-600' : ''}>숫자 포함</li>
						<li class={/(?=.*[@$!%*?&])/.test(newPassword) ? 'text-green-600' : ''}>
							특수문자 포함 (@$!%*?&)
						</li>
					</ul>
				</div>
			</div>

			<!-- 새 비밀번호 확인 -->
			<div>
				<label for="confirm-password" class="block text-sm font-medium text-gray-700">
					새 비밀번호 확인
				</label>
				<div class="mt-1">
					<input
						id="confirm-password"
						name="confirm-password"
						type="password"
						autocomplete="new-password"
						bind:value={confirmPassword}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="새 비밀번호를 다시 입력하세요"
					/>
				</div>

				{#if confirmPassword && newPassword !== confirmPassword}
					<p class="mt-1 text-xs text-red-600">비밀번호가 일치하지 않습니다.</p>
				{:else if confirmPassword && newPassword === confirmPassword}
					<p class="mt-1 text-xs text-green-600">비밀번호가 일치합니다.</p>
				{/if}
			</div>

			<!-- 메시지 표시 -->
			{#if passwordMessage}
				<div
					class={`rounded-md p-3 ${passwordMessageType === 'error' ? 'border border-red-200 bg-red-50' : 'border border-green-200 bg-green-50'}`}
				>
					<p
						class={`text-sm ${passwordMessageType === 'error' ? 'text-red-700' : 'text-green-700'}`}
					>
						{passwordMessage}
					</p>
				</div>
			{/if}

			<!-- 변경 버튼 -->
			<div class="flex justify-end">
				<button
					type="button"
					onclick={handlePasswordChange}
					disabled={isChangingPassword ||
						!currentPassword ||
						!newPassword ||
						!confirmPassword ||
						!!validatePassword(newPassword) ||
						!!validatePasswordConfirm(newPassword, confirmPassword)}
					class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isChangingPassword}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						변경 중...
					{:else}
						비밀번호 변경
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
