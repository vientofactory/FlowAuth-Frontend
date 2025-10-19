<script lang="ts">
	import { apiClient } from '$lib';

	interface Props {
		onPasswordChanged?: () => void;
	}

	let { onPasswordChanged }: Props = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isChangingPassword = $state(false);
	let passwordMessage = $state('');
	let passwordMessageType: 'error' | 'success' = $state('error');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	// 비밀번호 요구사항별 상태
	interface PasswordRequirement {
		id: string;
		label: string;
		check: (password: string) => boolean;
		met: boolean;
	}

	let requirements = $state<PasswordRequirement[]>([
		{
			id: 'length',
			label: '최소 8자 이상',
			check: (password: string) => password.length >= 8,
			met: false
		},
		{
			id: 'lowercase',
			label: '소문자 포함',
			check: (password: string) => /(?=.*[a-z])/.test(password),
			met: false
		},
		{
			id: 'uppercase',
			label: '대문자 포함',
			check: (password: string) => /(?=.*[A-Z])/.test(password),
			met: false
		},
		{
			id: 'number',
			label: '숫자 포함',
			check: (password: string) => /(?=.*\d)/.test(password),
			met: false
		},
		{
			id: 'special',
			label: '특수문자 포함 (@$!%*?&)',
			check: (password: string) => /(?=.*[@$!%*?&])/.test(password),
			met: false
		}
	]);

	// 비밀번호 검증 함수들
	function validatePassword(password: string) {
		const failedRequirements = requirements.filter((req) => !req.check(password));
		if (failedRequirements.length > 0) {
			return `비밀번호 요구사항을 만족하지 않습니다: ${failedRequirements.map((r) => r.label).join(', ')}`;
		}
		return '';
	}

	function validatePasswordConfirm(password: string, confirmPassword: string) {
		if (password !== confirmPassword) {
			return '비밀번호가 일치하지 않습니다.';
		}
		return '';
	}

	// 실시간 요구사항 검증
	$effect(() => {
		requirements.forEach((requirement) => {
			requirement.met = requirement.check(newPassword);
		});
	});

	// 전체 비밀번호 검증 상태
	let isPasswordValid = $derived(requirements.every((req) => req.met));
	let isConfirmPasswordValid = $derived(confirmPassword && newPassword === confirmPassword);

	// 실시간 검증 결과
	$effect(() => {
		if (newPassword) {
			const error = validatePassword(newPassword);
			if (error && newPassword.length > 0) {
				// 사용자가 입력 중일 때는 에러 메시지를 표시하지 않음
				passwordMessage = '';
				passwordMessageType = 'error';
			} else if (confirmPassword && newPassword !== confirmPassword) {
				passwordMessage = '';
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
			await apiClient.changePassword({
				currentPassword,
				newPassword
			});

			// API 호출이 성공하면 (에러가 throw되지 않으면) 성공으로 간주
			// 폼 초기화
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
			passwordMessage = ''; // 메시지 초기화

			// 성공 콜백 호출 (폼 닫기 및 토스트 표시)
			onPasswordChanged?.();
		} catch (error: unknown) {
			// 에러 메시지 처리
			let errorMessage = '서버 오류가 발생했습니다.';
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			// 성공 메시지가 에러로 잘못 표시되는 것을 방지
			if (errorMessage.includes('성공적으로')) {
				// 성공으로 처리
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
				passwordMessage = '';
				onPasswordChanged?.();
			} else {
				passwordMessage = errorMessage;
				passwordMessageType = 'error';
			}
		} finally {
			isChangingPassword = false;
		}
	}

	// 비밀번호 강도 체크
	function getPasswordStrength(_password: string) {
		const metRequirements = requirements.filter((req) => req.met).length;
		const totalRequirements = requirements.length;
		const percentage = (metRequirements / totalRequirements) * 100;

		if (percentage < 40)
			return { text: '매우 약함', color: 'text-red-600', bg: 'bg-red-400', width: '20%' };
		if (percentage < 60)
			return { text: '약함', color: 'text-red-500', bg: 'bg-red-300', width: '40%' };
		if (percentage < 80)
			return { text: '보통', color: 'text-yellow-500', bg: 'bg-yellow-400', width: '60%' };
		if (percentage < 100)
			return { text: '강함', color: 'text-blue-500', bg: 'bg-blue-400', width: '80%' };
		return { text: '매우 강함', color: 'text-green-500', bg: 'bg-green-400', width: '100%' };
	}

	let passwordStrength = $derived(newPassword ? getPasswordStrength(newPassword) : null);

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}
</script>

<div class="bg-white shadow sm:rounded-lg">
	<div class="px-4 py-5 sm:p-6">
		<h3 class="text-lg leading-6 font-medium text-gray-900">비밀번호 변경</h3>
		<div class="mt-2 max-w-xl text-sm text-gray-500">
			<p>보안을 위해 정기적으로 비밀번호를 변경해주세요.</p>
		</div>

		<div class="mt-5 space-y-6">
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
				<div class="relative mt-1">
					<input
						id="new-password"
						name="new-password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						bind:value={newPassword}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="새 비밀번호를 입력하세요"
					/>
					<button
						type="button"
						onclick={togglePasswordVisibility}
						aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보이기'}
						class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
					>
						<i class={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
					</button>
				</div>

				<!-- 비밀번호 강도 표시 -->
				{#if newPassword && passwordStrength}
					<div class="mt-3">
						<div class="flex items-center justify-between text-sm">
							<span class={passwordStrength.color + ' font-medium'}>
								비밀번호 강도: {passwordStrength.text}
							</span>
							<span class="text-xs text-gray-500">
								{requirements.filter((req) => req.met).length}/{requirements.length} 조건 충족
							</span>
						</div>
						<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								class="{passwordStrength.bg} h-2 rounded-full transition-all duration-500 ease-out"
								style="width: {passwordStrength.width}"
							></div>
						</div>
					</div>
				{/if}

				<!-- 비밀번호 요구사항 (실시간 체크) -->
				{#if newPassword}
					<div class="mt-4 rounded-lg border bg-gray-50 p-4">
						<p class="mb-3 text-sm font-medium text-gray-700">비밀번호 요구사항</p>
						<ul class="space-y-2">
							{#each requirements as requirement (requirement.id)}
								<li class="flex items-center text-sm">
									<div class="mr-3 flex-shrink-0">
										{#if requirement.met}
											<i class="fas fa-check-circle text-green-500"></i>
										{:else}
											<i class="fas fa-times-circle text-red-400"></i>
										{/if}
									</div>
									<span class={requirement.met ? 'text-green-700' : 'text-gray-600'}>
										{requirement.label}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				{:else}
					<div class="mt-4 rounded-lg border bg-gray-50 p-4">
						<p class="mb-3 text-sm font-medium text-gray-700">비밀번호 요구사항</p>
						<ul class="space-y-2 text-sm text-gray-600">
							<li class="flex items-center">
								<i class="fas fa-circle mr-3 text-xs text-gray-300"></i>
								최소 8자 이상
							</li>
							<li class="flex items-center">
								<i class="fas fa-circle mr-3 text-xs text-gray-300"></i>
								소문자 포함
							</li>
							<li class="flex items-center">
								<i class="fas fa-circle mr-3 text-xs text-gray-300"></i>
								대문자 포함
							</li>
							<li class="flex items-center">
								<i class="fas fa-circle mr-3 text-xs text-gray-300"></i>
								숫자 포함
							</li>
							<li class="flex items-center">
								<i class="fas fa-circle mr-3 text-xs text-gray-300"></i>
								특수문자 포함 (@$!%*?&)
							</li>
						</ul>
					</div>
				{/if}
			</div>

			<!-- 새 비밀번호 확인 -->
			<div>
				<label for="confirm-password" class="block text-sm font-medium text-gray-700">
					새 비밀번호 확인
				</label>
				<div class="relative mt-1">
					<input
						id="confirm-password"
						name="confirm-password"
						type={showConfirmPassword ? 'text' : 'password'}
						autocomplete="new-password"
						bind:value={confirmPassword}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm {confirmPassword
							? isConfirmPasswordValid
								? 'border-green-300 focus:border-green-500 focus:ring-green-500'
								: 'border-red-300 focus:border-red-500 focus:ring-red-500'
							: ''}"
						placeholder="새 비밀번호를 다시 입력하세요"
					/>
					<button
						type="button"
						onclick={toggleConfirmPasswordVisibility}
						aria-label={showConfirmPassword ? '비밀번호 확인 숨기기' : '비밀번호 확인 보이기'}
						class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
					>
						<i class={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
					</button>
				</div>

				{#if confirmPassword}
					<div class="mt-2 flex items-center">
						{#if isConfirmPasswordValid}
							<i class="fas fa-check-circle mr-2 text-green-500"></i>
							<p class="text-sm text-green-600">비밀번호가 일치합니다.</p>
						{:else}
							<i class="fas fa-times-circle mr-2 text-red-500"></i>
							<p class="text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>
						{/if}
					</div>
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
			<div class="flex justify-end pt-4">
				<button
					type="button"
					onclick={handlePasswordChange}
					disabled={isChangingPassword ||
						!currentPassword ||
						!newPassword ||
						!confirmPassword ||
						!isPasswordValid ||
						!isConfirmPasswordValid}
					class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-indigo-600"
				>
					{#if isChangingPassword}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						변경 중...
					{:else}
						<i class="fas fa-key mr-2"></i>
						비밀번호 변경
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
