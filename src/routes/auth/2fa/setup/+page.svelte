<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/utils/api';
	import { useToast } from '$lib/composables/useToast';
	import { createNumericInputHandler } from '$lib/utils/input.utils';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import QRCode from '$lib/components/QRCode.svelte';
	import type { TwoFactorSetup } from '$lib/types/2fa.types';

	const toast = useToast();

	let isLoading = true; // 초기 로딩 상태를 true로 설정
	let setupData: TwoFactorSetup | null = null;
	let hasError = false; // 에러 상태 추가
	let token = '';
	let step = 1; // 1: QR코드 표시, 2: 토큰 입력, 3: 백업코드 표시, 4: 완료

	// 토큰 유효성 검사 함수
	function isValidToken(value: string): boolean {
		return /^\d{6}$/.test(value);
	}

	// Create a mock field object for the input handler
	const tokenField = {
		get value() {
			return token;
		},
		set value(val: string) {
			token = val;
		},
		clear: () => {} // No validation in this simple case
	};

	// 토큰 입력 핸들러 - 숫자만 허용
	const handleTokenInput = createNumericInputHandler(tokenField);

	// 폼 제출 핸들러
	function handleSubmit(event: Event) {
		event.preventDefault();
		verifyAndEnable();
	}

	async function setupTwoFactor() {
		isLoading = true;

		try {
			// 간단한 API 호출
			setupData = await apiClient.setupTwoFactor();
			step = 1;
		} catch (error) {
			console.error('2FA 설정 실패:', error);
			toast.error(error instanceof Error ? error.message : '2FA 설정을 시작할 수 없습니다.');
			hasError = true; // 에러 상태 설정
		} finally {
			isLoading = false;
		}
	}

	async function verifyAndEnable() {
		if (!setupData || !token.trim()) {
			toast.error('토큰을 입력해주세요.');
			return;
		}

		if (!isValidToken(token)) {
			toast.error('6자리 숫자 토큰을 입력해주세요.');
			return;
		}

		isLoading = true;
		try {
			await apiClient.enableTwoFactor({
				token: token.trim(),
				secret: setupData.secret,
				backupCodes: setupData.backupCodes
			});

			step = 3; // 백업코드 표시 단계로 이동
		} catch (error) {
			console.error('2FA 활성화 실패:', error);
			toast.error(error instanceof Error ? error.message : '잘못된 토큰입니다. 다시 시도해주세요.');
		} finally {
			isLoading = false;
		}
	}

	function copyBackupCodes() {
		if (!setupData) return;

		const codesText = setupData.backupCodes.join('\n');
		if (navigator.clipboard) {
			navigator.clipboard.writeText(codesText).then(() => {
				toast.success('백업 코드가 클립보드에 복사되었습니다.');
			});
		}
	}

	function downloadBackupCodes() {
		if (!setupData) return;

		const codesText = setupData.backupCodes.join('\n');
		const blob = new Blob([codesText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = '2fa-backup-codes.txt';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success('백업 코드가 다운로드되었습니다.');
	}

	function completeSetup() {
		toast.success('2FA가 성공적으로 설정되었습니다!');
		goto('/dashboard');
	}

	function goBack() {
		goto('/dashboard/profile');
	}

	function retrySetup() {
		hasError = false;
		setupTwoFactor();
	}

	onMount(() => {
		setupTwoFactor();
	});
</script>

<svelte:head>
	<title>2FA 설정 - FlowAuth</title>
</svelte:head>

<div class="two-factor-setup">
	<div class="container">
		<div class="header">
			<h1>2단계 인증 설정</h1>
			<p>계정 보안을 강화하기 위해 2단계 인증을 설정합니다.</p>
		</div>

		{#if isLoading && !setupData}
			<Card>
				<div class="loading-section">
					<div class="loading-container">
						<div class="loading-spinner">
							<div class="spinner-ring"></div>
						</div>
						<div class="loading-content">
							<h3 class="loading-title">2FA 설정 준비 중</h3>
							<p class="loading-description">잠시만 기다려주세요...</p>
						</div>
					</div>
				</div>
			</Card>
		{:else if setupData}
			<!-- 단계별 진행 표시 -->
			<div class="setup-layout">
				<div class="step-indicator">
					<div class="step" class:active={step >= 1}>
						<div class="step-number">1</div>
						<span>QR 코드</span>
					</div>
					<div class="step-line" class:active={step >= 2}></div>
					<div class="step" class:active={step >= 2}>
						<div class="step-number">2</div>
						<span>토큰 확인</span>
					</div>
					<div class="step-line" class:active={step >= 3}></div>
					<div class="step" class:active={step >= 3}>
						<div class="step-number">3</div>
						<span>백업 코드</span>
					</div>
				</div>

				<!-- 단계별 콘텐츠 -->
				<div class="content-area">
					{#if step === 1}
						<Card>
							<div class="step-content">
								<h2>1단계: 인증 앱 설정</h2>
								<p>Google Authenticator, Authy 등의 인증 앱을 사용하여 QR 코드를 스캔하세요.</p>

								<div class="qr-section">
									<QRCode qrCodeUrl={setupData.qrCodeUrl} secret={setupData.secret} size={250} />
								</div>

								<div class="instructions">
									<h3>설정 방법:</h3>
									<ol>
										<li>인증 앱을 실행하세요</li>
										<li>QR 코드를 스캔하거나 시크릿 키를 수동으로 입력하세요</li>
										<li>생성된 6자리 토큰을 아래에 입력하세요</li>
									</ol>
								</div>

								<div class="actions">
									<Button variant="secondary" onclick={goBack}>취소</Button>
									<Button onclick={() => (step = 2)}>다음</Button>
								</div>
							</div>
						</Card>
					{:else if step === 2}
						<Card>
							<div class="step-content">
								<h2>2단계: 토큰 확인</h2>
								<p>인증 앱에서 생성된 6자리 토큰을 입력하세요.</p>

								<form onsubmit={handleSubmit} class="token-form">
									<div class="form-group">
										<label for="token">6자리 토큰</label>
										<input
											id="token"
											type="text"
											placeholder="000000"
											bind:value={token}
											maxlength="6"
											inputmode="numeric"
											class="token-input"
											class:error={token && !isValidToken(token)}
											oninput={handleTokenInput}
										/>
										{#if token && !isValidToken(token)}
											<p class="error-message">6자리 숫자를 입력해주세요.</p>
										{/if}
									</div>

									<div class="actions">
										<Button variant="secondary" onclick={() => (step = 1)}>이전</Button>
										<Button type="submit" disabled={isLoading}>
											{#if isLoading}
												확인 중...
											{:else}
												확인
											{/if}
										</Button>
									</div>
								</form>
							</div>
						</Card>
					{:else if step === 3}
						<Card>
							<div class="step-content">
								<h2>3단계: 백업 코드 저장</h2>
								<p>2FA 앱에 접근할 수 없는 경우를 대비하여 백업 코드를 안전하게 저장하세요.</p>

								<div class="backup-codes">
									<div class="codes-grid">
										{#each setupData.backupCodes as code, index (index)}
											<div class="code-item">
												<span class="code-number">{index + 1}.</span>
												<code>{code}</code>
											</div>
										{/each}
									</div>
								</div>

								<div class="warning">
									⚠️ <strong>중요:</strong> 백업 코드는 한 번만 사용할 수 있습니다. 모든 코드를 사용하면
									2FA를 재설정해야 합니다.
								</div>

								<div class="actions">
									<Button variant="secondary" onclick={copyBackupCodes}>복사</Button>
									<Button variant="secondary" onclick={downloadBackupCodes}>다운로드</Button>
									<Button onclick={completeSetup}>완료</Button>
								</div>
							</div>
						</Card>
					{/if}
				</div>
			</div>
		{:else if hasError}
			<Card>
				<div class="error-section">
					<p>2FA 설정을 시작할 수 없습니다.</p>
					<Button onclick={retrySetup}>다시 시도</Button>
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	/* 반응형 디자인 시스템 */
	.two-factor-setup {
		min-height: 100vh;
		background: #f8fafc;
		padding: 1rem 0.5rem;
	}

	.container {
		max-width: 320px;
		margin: 0 auto;
		padding: 0 0.5rem;
	}

	/* 작은 모바일 (320px - 479px) */
	@media (min-width: 320px) {
		.two-factor-setup {
			padding: 1rem 0.75rem;
		}

		.container {
			max-width: 320px;
			padding: 0 0.75rem;
		}
	}

	/* 중간 모바일 (480px - 639px) */
	@media (min-width: 480px) {
		.two-factor-setup {
			padding: 1.5rem 1rem;
		}

		.container {
			max-width: 480px;
			padding: 0 1rem;
		}
	}

	/* 큰 모바일/작은 태블릿 (640px - 767px) */
	@media (min-width: 640px) {
		.two-factor-setup {
			padding: 2rem 1rem;
		}

		.container {
			max-width: 640px;
			padding: 0 1rem;
		}
	}

	/* 태블릿 (768px - 1023px) */
	@media (min-width: 768px) {
		.two-factor-setup {
			padding: 2rem 1.5rem;
		}

		.container {
			max-width: 768px;
			padding: 0 1.5rem;
		}
	}

	/* 작은 데스크톱 (1024px - 1199px) */
	@media (min-width: 1024px) {
		.two-factor-setup {
			padding: 2.5rem 2rem;
		}

		.container {
			max-width: 1024px;
			padding: 0 2rem;
		}
	}

	/* 큰 데스크톱 (1200px - 1439px) */
	@media (min-width: 1200px) {
		.two-factor-setup {
			padding: 3rem 2rem;
		}

		.container {
			max-width: 1200px;
			padding: 0 2rem;
		}
	}

	/* 초대형 화면 (1440px+) */
	@media (min-width: 1440px) {
		.two-factor-setup {
			padding: 3rem 3rem;
		}

		.container {
			max-width: 1400px;
			padding: 0 3rem;
		}
	}

	.header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
		line-height: 1.2;
	}

	.header p {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.header h1 {
			font-size: 1.625rem;
		}

		.header p {
			font-size: 0.9rem;
		}
	}

	/* 중간 모바일 */
	@media (min-width: 480px) {
		.header {
			margin-bottom: 2rem;
		}

		.header h1 {
			font-size: 1.75rem;
		}

		.header p {
			font-size: 0.95rem;
		}
	}

	/* 큰 모바일 */
	@media (min-width: 640px) {
		.header h1 {
			font-size: 1.875rem;
		}

		.header p {
			font-size: 1rem;
		}
	}

	/* 태블릿 */
	@media (min-width: 768px) {
		.header {
			margin-bottom: 2.5rem;
		}

		.header h1 {
			font-size: 2rem;
		}
	}

	/* 데스크톱 */
	@media (min-width: 1024px) {
		.header {
			margin-bottom: 3rem;
		}

		.header h1 {
			font-size: 2.25rem;
		}
	}

	/* 큰 데스크톱 */
	@media (min-width: 1200px) {
		.header h1 {
			font-size: 2.5rem;
		}
	}

	/* 메인 설정 레이아웃 */
	.setup-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: stretch;
	}

	/* 태블릿 이상에서 가로 배치 */
	@media (min-width: 768px) {
		.setup-layout {
			flex-direction: row;
			gap: 2rem;
			align-items: flex-start;
		}
	}

	/* 데스크톱에서 더 큰 간격 */
	@media (min-width: 1024px) {
		.setup-layout {
			gap: 2.5rem;
		}
	}

	/* 큰 데스크톱에서 최대 간격 */
	@media (min-width: 1200px) {
		.setup-layout {
			gap: 3rem;
		}
	}

	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		min-height: fit-content;
	}

	/* 모바일에서 가로 배치 */
	@media (max-width: 767px) {
		.step-indicator {
			flex-direction: row;
			justify-content: center;
			padding: 0.75rem;
			gap: 0.75rem;
		}
	}

	/* 태블릿 */
	@media (min-width: 768px) {
		.step-indicator {
			min-width: 200px;
			padding: 1.25rem;
		}
	}

	/* 데스크톱 */
	@media (min-width: 1024px) {
		.step-indicator {
			min-width: 240px;
			padding: 1.5rem;
		}
	}

	/* 큰 데스크톱 */
	@media (min-width: 1200px) {
		.step-indicator {
			min-width: 280px;
			padding: 2rem;
			position: sticky;
			top: 2rem;
		}
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.5;
		transition: opacity 0.3s;
	}

	.step.active {
		opacity: 1;
	}

	.step-number {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.3s;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.step-number {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}
	}

	/* 중간 모바일 이상 */
	@media (min-width: 480px) {
		.step-number {
			width: 44px;
			height: 44px;
			font-size: 1.125rem;
		}
	}

	.step.active .step-number {
		background: #3b82f6;
		color: white;
	}

	.step span {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		text-align: center;
		line-height: 1.2;
	}

	/* 모바일에서 더 작은 폰트 */
	@media (max-width: 479px) {
		.step span {
			font-size: 0.7rem;
		}
	}

	/* 태블릿 이상에서 더 큰 폰트 */
	@media (min-width: 768px) {
		.step span {
			font-size: 0.875rem;
		}
	}

	.step-line {
		width: 2px;
		height: 32px;
		background: #e5e7eb;
		margin: 0.25rem 0;
		transition: background-color 0.3s;
	}

	/* 모바일에서 가로 선 */
	@media (max-width: 767px) {
		.step-line {
			width: 40px;
			height: 2px;
			margin: 0 0.5rem;
		}
	}

	/* 태블릿 이상에서 더 긴 선 */
	@media (min-width: 768px) {
		.step-line {
			height: 40px;
		}
	}

	.step-line.active {
		background: #3b82f6;
	}

	/* 콘텐츠 영역 */
	.content-area {
		flex: 1;
		min-width: 0;
	}

	/* 데스크톱에서 최대 너비 제한 */
	@media (min-width: 1024px) {
		.content-area {
			max-width: 600px;
		}
	}

	/* 큰 데스크톱에서 더 큰 최대 너비 */
	@media (min-width: 1200px) {
		.content-area {
			max-width: 700px;
		}
	}

	.step-content {
		padding: 1.25rem;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.step-content {
			padding: 1.5rem;
		}
	}

	/* 중간 모바일 */
	@media (min-width: 480px) {
		.step-content {
			padding: 1.75rem;
		}
	}

	/* 큰 모바일 */
	@media (min-width: 640px) {
		.step-content {
			padding: 2rem;
		}
	}

	/* 태블릿 */
	@media (min-width: 768px) {
		.step-content {
			padding: 2rem;
		}
	}

	/* 데스크톱 */
	@media (min-width: 1024px) {
		.step-content {
			padding: 2.25rem;
		}
	}

	/* 큰 데스크톱 */
	@media (min-width: 1200px) {
		.step-content {
			padding: 2.5rem;
		}
	}

	.step-content h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.step-content h2 {
			font-size: 1.375rem;
		}
	}

	/* 중간 모바일 */
	@media (min-width: 480px) {
		.step-content h2 {
			font-size: 1.5rem;
		}
	}

	/* 태블릿 이상 */
	@media (min-width: 768px) {
		.step-content h2 {
			margin-bottom: 1rem;
		}
	}

	.step-content p {
		color: #6b7280;
		margin-bottom: 1.25rem;
		line-height: 1.6;
		font-size: 0.875rem;
	}

	/* 태블릿 이상에서 더 큰 폰트 */
	@media (min-width: 768px) {
		.step-content p {
			font-size: 0.95rem;
			margin-bottom: 1.5rem;
		}
	}

	.qr-section {
		display: flex;
		justify-content: center;
		margin: 1.5rem 0;
	}

	/* 태블릿 이상에서 더 큰 마진 */
	@media (min-width: 768px) {
		.qr-section {
			margin: 2rem 0;
		}
	}

	.instructions {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.instructions h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.instructions ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.instructions li {
		color: #4b5563;
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	.token-form {
		max-width: 280px;
		margin: 0 auto;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.token-form {
			max-width: 300px;
		}
	}

	/* 중간 모바일 */
	@media (min-width: 480px) {
		.token-form {
			max-width: 320px;
		}
	}

	/* 태블릿 이상 */
	@media (min-width: 768px) {
		.token-form {
			max-width: 350px;
		}
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	/* 태블릿 이상에서 더 큰 마진 */
	@media (min-width: 768px) {
		.form-group {
			margin-bottom: 2rem;
		}
	}

	.form-group label {
		display: block;
		font-size: 0.8rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	/* 태블릿 이상에서 더 큰 폰트 */
	@media (min-width: 768px) {
		.form-group label {
			font-size: 0.875rem;
		}
	}

	.backup-codes {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 2rem 0;
	}

	.codes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.code-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.875rem;
	}

	.code-number {
		color: #6b7280;
		font-weight: 500;
		min-width: 20px;
	}

	.warning {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		color: #92400e;
		padding: 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		line-height: 1.5;
		margin-bottom: 2rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 1.5rem;
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.actions {
			gap: 0.75rem;
		}
	}

	/* 중간 모바일 */
	@media (min-width: 480px) {
		.actions {
			margin-top: 2rem;
		}
	}

	/* 터치 디바이스에서 더 큰 버튼 간격 */
	@media (hover: none) and (pointer: coarse) {
		.actions {
			gap: 1rem;
		}
	}

	.loading-section,
	.error-section {
		text-align: center;
		padding: 3rem 2rem;
	}

	.token-input {
		width: 100%;
		padding: 0.625rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		text-align: center;
		font-family: monospace;
		font-weight: 600;
		letter-spacing: 0.5rem;
		transition: all 0.2s;
	}

	/* 터치 디바이스에서 더 큰 패딩 */
	@media (hover: none) and (pointer: coarse) {
		.token-input {
			padding: 0.75rem;
			font-size: 1.125rem;
		}
	}

	/* 작은 모바일 */
	@media (min-width: 320px) {
		.token-input {
			padding: 0.75rem;
		}
	}

	.token-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Error styles */
	.token-input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.error-message {
		color: #ef4444;
		font-size: 0.75rem;
		margin-top: 0.5rem;
		margin-bottom: 0;
	}

	/* 태블릿 이상에서 더 큰 에러 메시지 */
	@media (min-width: 768px) {
		.error-message {
			font-size: 0.8rem;
		}
	}

	/* Loading UI Styles */
	.loading-section {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
		padding: 2rem 1rem;
		text-align: center;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 400px;
		width: 100%;
	}

	.loading-spinner {
		position: relative;
		width: 60px;
		height: 60px;
	}

	.spinner-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.loading-content {
		text-align: center;
		flex: 1;
	}

	.loading-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}

	.loading-description {
		color: #6b7280;
		margin-bottom: 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	/* 터치 디바이스 최적화 */
	@media (hover: none) and (pointer: coarse) {
		/* 터치 영역 최소 크기 보장 */
		.step-number {
			min-width: 48px;
			min-height: 48px;
		}

		.token-input {
			min-height: 48px;
		}

		.actions :global(button) {
			min-height: 48px;
			padding: 0.75rem 1.5rem;
		}

		/* 터치 시 하이라이트 효과 */
		.step-number,
		.token-input,
		.actions :global(button) {
			-webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
		}

		/* 더 큰 클릭 영역 */
		.code-item {
			min-height: 48px;
			padding: 0.75rem;
		}
	}
</style>
