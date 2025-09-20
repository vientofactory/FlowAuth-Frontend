<!-- 새로운 컴포넌트들 사용 예시 -->
<script lang="ts">
	import {
		FormField,
		TextareaField,
		LoadingButton,
		ErrorMessage,
		ErrorBoundary,
		ConfirmModal,
		useFieldValidation,
		useFormValidation,
		validators
	} from '$lib';

	// 폼 검증 필드들
	const emailField = useFieldValidation('', validators.email);
	const passwordField = useFieldValidation('', validators.password);
	const confirmPasswordField = useFieldValidation('', 
		(value: string) => validators.confirmPassword(passwordField.value)(value)
	);
	const descriptionField = useFieldValidation('');

	const form = useFormValidation({
		email: emailField,
		password: passwordField,
		confirmPassword: confirmPasswordField,
		description: descriptionField
	});

	let isLoading = $state(false);
	let showConfirmModal = $state(false);
	let error = $state<string | null>(null);

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (form.validateAll()) {
			isLoading = true;
			
			// 모의 API 호출
			setTimeout(() => {
				isLoading = false;
				console.log('Form submitted:', {
					email: emailField.value,
					password: passwordField.value,
					description: descriptionField.value
				});
			}, 2000);
		}
	}

	function handleDelete() {
		showConfirmModal = true;
	}

	function confirmDelete() {
		console.log('Deleted!');
		showConfirmModal = false;
	}
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">새로운 컴포넌트 사용 예시</h1>

	<ErrorBoundary {isLoading} {error} loadingMessage="폼을 처리하고 있습니다...">
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- 이메일 입력 -->
			<FormField
				label="이메일"
				name="email"
				type="email"
				bind:value={emailField.value}
				error={emailField.error}
				placeholder="your@email.com"
				icon="fas fa-envelope"
				required
				hint="유효한 이메일 주소를 입력해주세요"
				oninput={() => emailField.validate()}
			/>

			<!-- 비밀번호 입력 -->
			<FormField
				label="비밀번호"
				name="password"
				type="password"
				bind:value={passwordField.value}
				error={passwordField.error}
				placeholder="비밀번호를 입력하세요"
				icon="fas fa-lock"
				required
				hint="최소 6자 이상"
				oninput={() => passwordField.validate()}
			/>

			<!-- 비밀번호 확인 -->
			<FormField
				label="비밀번호 확인"
				name="confirmPassword"
				type="password"
				bind:value={confirmPasswordField.value}
				error={confirmPasswordField.error}
				placeholder="비밀번호를 다시 입력하세요"
				icon="fas fa-lock"
				required
				oninput={() => confirmPasswordField.validate()}
			/>

			<!-- 설명 (textarea) -->
			<TextareaField
				label="설명"
				name="description"
				bind:value={descriptionField.value}
				placeholder="설명을 입력하세요 (선택사항)"
				hint="최대 500자까지 입력 가능합니다"
				rows={4}
			/>

			<!-- 버튼들 -->
			<div class="flex justify-between">
				<LoadingButton
					variant="danger"
					onclick={handleDelete}
					icon="fas fa-trash"
				>
					삭제
				</LoadingButton>

				<LoadingButton
					type="submit"
					loading={isLoading}
					disabled={!form.isValid}
					loadingText="저장 중..."
					icon="fas fa-save"
				>
					저장
				</LoadingButton>
			</div>
		</form>
	</ErrorBoundary>

	<!-- 확인 모달 -->
	<ConfirmModal
		open={showConfirmModal}
		title="삭제 확인"
		message="정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
		confirmText="삭제"
		cancelText="취소"
		confirmVariant="danger"
		onConfirm={confirmDelete}
		onCancel={() => showConfirmModal = false}
	/>
</div>