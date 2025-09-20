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

	// 로딩 단계별 상태 관리
	let loadingStep = 0; // 0: 시작, 1: 키 생성, 2: QR 준비, 3: 백업코드 생성, 4: 완료
	let loadingSteps = [
		{ icon: '🔐', text: '보안 키 생성', active: false },
		{ icon: '📱', text: 'QR 코드 준비', active: false },
		{ icon: '🛡️', text: '백업 코드 생성', active: false }
	];

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
		loadingStep = 0;

		try {
			// 단계별 진행 표시
			await updateLoadingStep(0, 300); // 보안 키 생성 시작

			// 실제 API 호출 (시간 측정)
			const startTime = Date.now();
			setupData = await apiClient.setupTwoFactor();
			const apiTime = Date.now() - startTime;

			// API 호출이 빠르면 최소 시간을 확보
			const remainingTime = Math.max(0, 1500 - apiTime);

			await updateLoadingStep(1, remainingTime * 0.6); // QR 코드 준비
			await updateLoadingStep(2, remainingTime * 0.4); // 백업 코드 생성

			loadingStep = 3; // 완료
			await new Promise((resolve) => setTimeout(resolve, 500)); // 완료 애니메이션

			step = 1;
		} catch (error) {
			console.error('2FA 설정 실패:', error);
			toast.error(error instanceof Error ? error.message : '2FA 설정을 시작할 수 없습니다.');
			hasError = true; // 에러 상태 설정
		} finally {
			isLoading = false;
		}
	}

	// 로딩 단계 업데이트 함수
	async function updateLoadingStep(stepIndex: number, delay: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				loadingStep = stepIndex + 1;
				// 로딩 단계 배열 업데이트
				loadingSteps = loadingSteps.map((step, index) => ({
					...step,
					active: index <= stepIndex
				}));
				resolve();
			}, delay);
		});
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
		goto('/profile');
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
					<!-- 로딩 애니메이션 -->
					<div class="loading-container">
						<div class="loading-spinner">
							<div class="spinner-ring"></div>
							<div class="spinner-ring"></div>
							<div class="spinner-ring"></div>
							<div class="spinner-ring"></div>
						</div>
						<div class="loading-content">
							<h3 class="loading-title">2FA 설정 준비 중</h3>
							<p class="loading-description">
								{#if loadingStep === 0}
									보안 키를 생성하고 있습니다...
								{:else if loadingStep === 1}
									QR 코드를 준비하고 있습니다...
								{:else if loadingStep === 2}
									백업 코드를 생성하고 있습니다...
								{:else}
									거의 완료되었습니다...
								{/if}
							</p>
							<div class="loading-steps">
								{#each loadingSteps as step, index (index)}
									<div
										class="loading-step"
										class:active={step.active}
										class:completed={loadingStep > index}
									>
										<div class="step-icon">{step.icon}</div>
										<div class="step-text">
											<span>{step.text}</span>
											{#if step.active && loadingStep === index + 1}
												<div class="step-progress">
													<div class="progress-bar"></div>
												</div>
											{:else if loadingStep > index}
												<div class="step-check">✓</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
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
	.two-factor-setup {
		min-height: 100vh;
		background: #f8fafc;
		padding: 2rem 1rem;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
	}

	/* 넓은 화면에서 더 큰 컨테이너 */
	@media (min-width: 1024px) {
		.container {
			max-width: 1200px;
		}
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.header p {
		color: #6b7280;
		font-size: 1rem;
	}

	/* 메인 설정 레이아웃 */
	.setup-layout {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	/* 모바일에서는 세로 배치 */
	@media (max-width: 768px) {
		.setup-layout {
			flex-direction: column;
			gap: 1.5rem;
		}
	}

	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 200px;
		padding: 1rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* 넓은 화면에서는 더 큰 단계 표시 */
	@media (min-width: 1024px) {
		.step-indicator {
			min-width: 250px;
			padding: 1.5rem;
		}
	}

	/* 모바일에서는 가로 배치 */
	@media (max-width: 768px) {
		.step-indicator {
			flex-direction: row;
			justify-content: center;
			min-width: auto;
			padding: 1rem;
			gap: 1rem;
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
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.125rem;
		transition: all 0.3s;
	}

	.step.active .step-number {
		background: #3b82f6;
		color: white;
	}

	.step-line {
		width: 2px;
		height: 40px;
		background: #e5e7eb;
		margin: 0.5rem 0;
		transition: background-color 0.3s;
	}

	.step-line.active {
		background: #3b82f6;
	}

	/* 모바일에서는 가로 선 */
	@media (max-width: 768px) {
		.step-line {
			width: 60px;
			height: 2px;
			margin: 0 1rem;
		}
	}

	/* 콘텐츠 영역 */
	.content-area {
		flex: 1;
		min-width: 0;
	}

	.step-content {
		padding: 2rem;
	}

	.step-content h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.step-content p {
		color: #6b7280;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.qr-section {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
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
		max-width: 300px;
		margin: 0 auto;
	}

	.form-group {
		margin-bottom: 2rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
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
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.loading-section,
	.error-section {
		text-align: center;
		padding: 3rem 2rem;
	}

	.token-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		text-align: center;
		font-family: monospace;
		font-weight: 600;
		letter-spacing: 0.5rem;
	}

	.token-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.two-factor-setup {
		padding: 1rem 0.5rem;
	}

	.step-indicator {
		flex-direction: column;
		gap: 1rem;
	}

	.step-line {
		width: 2px;
		height: 40px;
		margin: 0;
	}

	.step-content {
		padding: 1.5rem;
	}

	/* Error styles */
	.token-input.error {
		border-color: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.error-message {
		color: #ef4444;
		font-size: 0.875rem;
		margin-top: 0.5rem;
		margin-bottom: 0;
	}

	/* Loading UI Styles */
	.loading-section {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		padding: 2rem;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		max-width: 500px;
		width: 100%;
	}

	/* 넓은 화면에서 로딩 컨테이너 가로 배치 */
	@media (min-width: 1024px) {
		.loading-container {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			max-width: 800px;
			gap: 3rem;
		}
	}

	.loading-spinner {
		position: relative;
		width: 80px;
		height: 80px;
	}

	/* 넓은 화면에서 스피너 크기 조정 */
	@media (min-width: 1024px) {
		.loading-spinner {
			width: 100px;
			height: 100px;
		}
	}

	.spinner-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1.5s linear infinite;
	}

	.spinner-ring:nth-child(2) {
		animation-delay: 0.2s;
		opacity: 0.8;
	}

	.spinner-ring:nth-child(3) {
		animation-delay: 0.4s;
		opacity: 0.6;
	}

	.spinner-ring:nth-child(4) {
		animation-delay: 0.6s;
		opacity: 0.4;
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

	/* 넓은 화면에서 로딩 콘텐츠 정렬 */
	@media (min-width: 1024px) {
		.loading-content {
			text-align: left;
		}
	}

	.loading-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.loading-description {
		color: #6b7280;
		margin-bottom: 2rem;
		font-size: 0.875rem;
	}

	.loading-steps {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	/* 넓은 화면에서 로딩 단계 가로 배치 */
	@media (min-width: 1024px) {
		.loading-steps {
			flex-direction: row;
			justify-content: space-between;
			gap: 2rem;
			width: auto;
			margin-right: 2rem;
		}
	}

	.loading-step {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 2px solid #e5e7eb;
		transition: all 0.3s ease;
		opacity: 0.6;
		transform: translateY(10px);
	}

	/* 넓은 화면에서 로딩 단계 스타일 조정 */
	@media (min-width: 1024px) {
		.loading-step {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 0.75rem;
			padding: 1.5rem 1rem;
			min-width: 120px;
			transform: translateY(0);
		}
	}

	.loading-step.active {
		opacity: 1;
		transform: translateY(0);
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.loading-step.completed {
		opacity: 1;
		transform: translateY(0);
		border-color: #10b981;
		background: #ecfdf5;
	}

	.step-icon {
		font-size: 1.25rem;
		min-width: 30px;
		text-align: center;
	}

	.step-progress {
		margin-left: auto;
		width: 60px;
		height: 4px;
		background: #e5e7eb;
		border-radius: 2px;
		overflow: hidden;
	}

	/* 넓은 화면에서 진행 바 스타일 조정 */
	@media (min-width: 1024px) {
		.step-progress {
			margin-left: 0;
			margin-top: 0.5rem;
			width: 80px;
		}
	}

	.progress-bar {
		height: 100%;
		background: #3b82f6;
		border-radius: 2px;
		animation: progress 2s ease-in-out infinite;
	}

	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
		}
	}

	.step-check {
		margin-left: auto;
		color: #10b981;
		font-size: 1.25rem;
		font-weight: bold;
	}

	/* 넓은 화면에서 체크 표시 위치 조정 */
	@media (min-width: 1024px) {
		.step-check {
			margin-left: 0;
			margin-top: 0.5rem;
		}
	}

	/* 반응형 디자인 */
	@media (max-width: 640px) {
		.two-factor-setup {
			padding: 1rem 0.5rem;
		}

		.container {
			max-width: 100%;
		}

		.header h1 {
			font-size: 1.5rem;
		}

		.loading-container {
			gap: 1.5rem;
			padding: 1rem;
		}

		.loading-steps {
			gap: 0.75rem;
		}

		.loading-step {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.step-icon {
			font-size: 1.125rem;
			min-width: 25px;
		}

		.setup-layout {
			gap: 1rem;
		}

		.step-indicator {
			min-width: auto;
			padding: 0.75rem;
		}

		.step-content {
			padding: 1rem;
		}

		.actions {
			flex-direction: column;
			align-items: stretch;
		}

		.actions :global(button) {
			width: 100%;
		}
	}

	/* 태블릿 반응형 */
	@media (min-width: 641px) and (max-width: 1023px) {
		.container {
			max-width: 700px;
		}

		.setup-layout {
			gap: 1.5rem;
		}

		.step-indicator {
			min-width: 180px;
			padding: 1rem;
		}

		.loading-container {
			max-width: 600px;
			gap: 2.5rem;
		}
	}

	/* 데스크톱 반응형 */
	@media (min-width: 1024px) {
		.two-factor-setup {
			padding: 3rem 1rem;
		}

		.container {
			max-width: 1200px;
		}

		.header {
			margin-bottom: 3rem;
		}

		.header h1 {
			font-size: 2.5rem;
		}

		.setup-layout {
			gap: 3rem;
			align-items: flex-start;
		}

		.step-indicator {
			min-width: 280px;
			padding: 2rem;
			position: sticky;
			top: 2rem;
		}

		.content-area {
			max-width: 600px;
		}

		.step-content {
			padding: 2.5rem;
		}

		.loading-container {
			max-width: 1000px;
			padding: 3rem;
			gap: 4rem;
		}

		.loading-spinner {
			width: 120px;
			height: 120px;
		}

		.loading-steps {
			margin-right: 3rem;
		}

		.loading-step {
			min-width: 140px;
			padding: 2rem 1.5rem;
		}
	}
</style>
