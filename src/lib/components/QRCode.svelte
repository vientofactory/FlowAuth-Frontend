<script lang="ts">
	import { onMount, tick } from 'svelte';

	let { qrCodeUrl, secret, size = 200 }: {
		qrCodeUrl: string;
		secret: string;
		size?: number;
	} = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// canvas가 준비되면 QR 코드를 로드
	$effect(() => {
		if (canvas && qrCodeUrl && isLoading) {
			loadQRCode();
		}
	});

	async function loadQRCode() {
		if (!qrCodeUrl) {
			error = 'QR 코드 URL이 제공되지 않았습니다.';
			isLoading = false;
			return;
		}

		try {
			console.log('Loading QR code:', qrCodeUrl);

			// QR 코드 이미지를 캔버스에 로드
			const img = new Image();
			img.crossOrigin = 'anonymous';

			await new Promise((resolve, reject) => {
				img.onload = () => {
					console.log('QR code image loaded successfully');
					resolve(void 0);
				};
				img.onerror = (e) => {
					console.error('Failed to load QR code image:', e);
					reject(new Error('QR 코드 이미지를 로드할 수 없습니다'));
				};
				img.src = qrCodeUrl;
			});

			// 캔버스에 이미지 그리기
			const ctx = canvas?.getContext('2d');
			if (!ctx) {
				throw new Error('Canvas 2D context not available');
			}

			// 캔버스 초기화 및 이미지 그리기
			ctx.clearRect(0, 0, size, size);
			ctx.drawImage(img, 0, 0, size, size);
			console.log('QR code drawn to canvas successfully');

			isLoading = false;
		} catch (err) {
			console.error('QR 코드 로드 실패:', err);
			error = err instanceof Error ? err.message : 'QR 코드를 로드할 수 없습니다.';
			isLoading = false;
		}
	}

	onMount(async () => {
		// 초기 로딩 상태 설정
		if (!qrCodeUrl) {
			error = 'QR 코드 URL이 제공되지 않았습니다.';
			isLoading = false;
		}
		// QR 코드 로드는 $effect에서 처리됨
	});

	function copySecret() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(secret).then(() => {
				// 성공 시 토스트 메시지 표시 (추후 구현)
			});
		} else {
			// 폴백: 텍스트 선택 후 복사
			const textArea = document.createElement('textarea');
			textArea.value = secret;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
	}
</script>

<div class="qr-code-container">
	<div class="qr-code-wrapper">
		{#if isLoading}
			<div class="loading-spinner">
				<div class="spinner"></div>
				<p>QR 코드 생성 중...</p>
			</div>
		{:else if error}
			<div class="error-message">
				<p>{error}</p>
			</div>
		{/if}

		<!-- Canvas는 항상 렌더링되지만 로딩 중일 때는 숨김 -->
		<canvas
			bind:this={canvas}
			width={size}
			height={size}
			class="qr-canvas"
			class:hidden={isLoading || !!error}
		></canvas>
	</div>

	<div class="secret-section">
		<label for="secret-input" class="secret-label">시크릿 키:</label>
		<div class="secret-input-wrapper">
			<input
				id="secret-input"
				type="text"
				value={secret}
				readonly
				class="secret-input"
			/>
			<button
				type="button"
				onclick={copySecret}
				class="copy-button"
				title="시크릿 키 복사"
				aria-label="시크릿 키 복사"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
				</svg>
			</button>
		</div>
		<p class="secret-hint">
			이 시크릿 키를 안전한 곳에 백업해두세요. QR 코드 스캔이 불가능한 경우 수동으로 입력할 수 있습니다.
		</p>
	</div>
</div>

<style>
	.qr-code-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 1.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.qr-code-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		min-height: 200px;
	}

	.qr-canvas {
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.loading-spinner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-message {
		color: #dc2626;
		text-align: center;
		padding: 1rem;
		background: #fef2f2;
		border-radius: 6px;
		border: 1px solid #fecaca;
	}

	.secret-section {
		width: 100%;
		max-width: 400px;
	}

	.secret-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.secret-input-wrapper {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.secret-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.875rem;
		background: #f9fafb;
		color: #374151;
	}

	.secret-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.copy-button:hover {
		background: #2563eb;
	}

	.copy-button:active {
		background: #1d4ed8;
	}

	.secret-hint {
		font-size: 0.75rem;
		color: #6b7280;
		line-height: 1.4;
		margin: 0;
	}

	@media (max-width: 640px) {
		.qr-code-container {
			padding: 1rem;
			gap: 1rem;
		}

		.secret-input-wrapper {
			flex-direction: column;
			gap: 0.5rem;
		}

		.copy-button {
			align-self: flex-end;
			min-width: 40px;
		}
	}

	/* Hidden utility class */
	.hidden {
		display: none !important;
	}
</style>