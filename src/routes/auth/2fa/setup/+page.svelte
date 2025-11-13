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
	import './+page.css';

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
									⚠️ <strong>중요:</strong> 백업 코드는 한 번만 사용할 수 있습니다. 2FA 토큰과 백업 코드를
									모두 분실한 경우 계정에 접근할 수 없게 됩니다.
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
