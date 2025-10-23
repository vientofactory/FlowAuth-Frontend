<script lang="ts">
	import { FormField, apiClient, createSuccessHint, createLoadingHint } from '$lib';
	import type { FieldValidation } from '$lib/composables/useFormValidation.svelte';
	import type { ValidationResult, DuplicationCheckResults } from '$lib';

	interface Props {
		usernameField: FieldValidation;
		emailField: FieldValidation;
		isLoading: boolean;
		onKeyPress: (event: KeyboardEvent) => void;
	}

	let { usernameField, emailField, isLoading, onKeyPress }: Props = $props();

	// 서버 측 검증 결과 저장
	let usernameCheckResult: ValidationResult | null = null;
	let emailCheckResult: ValidationResult | null = null;

	// 로딩 상태
	let isCheckingUsername = $state(false);
	let isCheckingEmail = $state(false);

	// 실시간 사용자명 중복 체크
	async function checkUsernameAvailability(username: string) {
		if (!username || username.trim().length < 3) {
			// 길이가 부족한 경우에만 서버 관련 오류 제거
			usernameCheckResult = null;
			if (
				usernameField.error &&
				(usernameField.error.includes('이미 사용중인') ||
					usernameField.error.includes('사용 가능한'))
			) {
				// 기본 유효성 검사가 다시 실행되도록 함
				usernameField.validate();
			}
			return;
		}

		// 기본 형식 검증 먼저 수행
		if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
			usernameCheckResult = null;
			return;
		}

		isCheckingUsername = true;

		try {
			const result = await apiClient.checkUsernameForRegistration(username.trim());
			usernameCheckResult = result;

			if (!result.available) {
				usernameField.setError(result.message);
			} else {
				// 사용 가능한 경우 에러 제거 (기본 검증은 유지)
				if (
					usernameField.error &&
					(usernameField.error.includes('이미 사용중인') ||
						usernameField.error.includes('사용 가능한'))
				) {
					usernameField.clear();
				}
			}
		} catch (error) {
			console.error('사용자명 중복 체크 실패:', error);
			usernameCheckResult = null;
		} finally {
			isCheckingUsername = false;
		}
	}

	// 실시간 이메일 중복 체크
	async function checkEmailAvailability(email: string) {
		if (!email || email.trim().length === 0) {
			// 비어있는 경우에만 서버 관련 오류 제거
			emailCheckResult = null;
			if (
				emailField.error &&
				(emailField.error.includes('이미 사용중인') || emailField.error.includes('사용 가능한'))
			) {
				// 기본 유효성 검사가 다시 실행되도록 함
				emailField.validate();
			}
			return;
		}

		// 이메일 형식 검증 먼저 수행
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			emailCheckResult = null;
			return;
		}

		isCheckingEmail = true;

		try {
			const result = await apiClient.checkEmail(email.trim());
			emailCheckResult = result;

			if (!result.available) {
				emailField.setError(result.message);
			} else {
				// 사용 가능한 경우 에러 제거 (기본 검증은 유지)
				if (
					emailField.error &&
					(emailField.error.includes('이미 사용중인') || emailField.error.includes('사용 가능한'))
				) {
					emailField.clear();
				}
			}
		} catch (error) {
			console.error('이메일 중복 체크 실패:', error);
			emailCheckResult = null;
		} finally {
			isCheckingEmail = false;
		}
	}

	// 서버 검증 결과를 외부에서 접근할 수 있도록 노출
	export function getValidationResults(): DuplicationCheckResults {
		return {
			username: usernameCheckResult,
			email: emailCheckResult
		};
	}

	// 동적 힌트 메시지
	let usernameHint = $derived(() => {
		if (isCheckingUsername) {
			return createLoadingHint('사용 가능 여부를 확인 중...');
		}
		if (usernameCheckResult?.available && !usernameField.error) {
			return createSuccessHint('사용 가능한 사용자명입니다');
		}
		return '사용자명은 3자 이상, 영문/숫자/언더스코어만 사용 가능합니다';
	});

	let emailHint = $derived(() => {
		if (isCheckingEmail) {
			return createLoadingHint('사용 가능 여부를 확인 중...');
		}
		if (emailCheckResult?.available && !emailField.error) {
			return createSuccessHint('사용 가능한 이메일입니다');
		}
		return '';
	});

	// 사용자명 변경 시 디바운스된 중복 체크
	$effect(() => {
		const username = usernameField.value;

		// 빈 값이면 상태 초기화
		if (!username) {
			usernameCheckResult = null;
			isCheckingUsername = false;
			return;
		}

		const timer = setTimeout(() => {
			checkUsernameAvailability(username);
		}, 500);

		return () => {
			clearTimeout(timer);
		};
	});

	// 이메일 변경 시 디바운스된 중복 체크
	$effect(() => {
		const email = emailField.value;

		// 빈 값이면 상태 초기화
		if (!email) {
			emailCheckResult = null;
			isCheckingEmail = false;
			return;
		}

		const timer = setTimeout(() => {
			checkEmailAvailability(email);
		}, 500);

		return () => {
			clearTimeout(timer);
		};
	});
</script>

<div class="space-y-6">
	<div class="space-y-4">
		<FormField
			label="사용자명"
			name="username"
			type="text"
			placeholder="사용자명을 입력하세요"
			required
			disabled={isLoading}
			bind:value={usernameField.value}
			error={usernameField.error}
			hint={usernameHint()}
			onkeydown={onKeyPress}
		/>

		<FormField
			label="이메일"
			name="email"
			type="email"
			placeholder="이메일을 입력하세요"
			required
			disabled={isLoading}
			bind:value={emailField.value}
			error={emailField.error}
			hint={emailHint()}
			onkeydown={onKeyPress}
		/>
	</div>
</div>
