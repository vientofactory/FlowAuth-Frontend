<script lang="ts">
	import { Button } from '$lib';
	import { apiClient } from '$lib';
	import { env } from '$lib/config/env';

	interface Props {
		selectedFile: File | null;
		previewUrl: string | null;
		isUploading: boolean;
		existingLogoUri?: string;
		onFileSelect: (file: File | null) => void;
		onRemoveExistingLogo?: () => void;
		cacheBuster?: string; // 캐시 무효화를 위한 버전 문자열
	}

	let {
		selectedFile = $bindable(null),
		previewUrl = $bindable(null),
		isUploading = false,
		existingLogoUri = '',
		onFileSelect,
		onRemoveExistingLogo,
		cacheBuster = ''
	}: Props = $props();

	let fileInput = $state<HTMLInputElement>();

	// 로컬 에러 상태
	let error = $state('');
	// eslint-disable-next-line svelte/prefer-writable-derived
	let imageLoadError = $state(false); // 이미지 로딩 실패 상태

	// 업로드 설정 정보
	let uploadConfig = $state<{
		allowedMimes: readonly string[];
		maxSize: number;
		maxSizeMB: number;
		destination: string;
	} | null>(null);
	let configLoading = $state(false);
	let configError = $state('');

	// 컴포넌트 마운트 시 설정 정보 로드
	$effect(() => {
		loadUploadConfig();
	});

	// existingLogoUri가 변경될 때 이미지 로딩 에러 상태 초기화
	$effect(() => {
		imageLoadError = false;
	});

	// 파일명 길이 제한 함수
	function truncateFileName(fileName: string, maxLength: number = 30): string {
		if (fileName.length <= maxLength) {
			return fileName;
		}

		const extension = fileName.substring(fileName.lastIndexOf('.'));
		const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
		const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);

		return `${truncatedName}...${extension}`;
	}

	// 파일 크기를 읽기 쉬운 형태로 변환
	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	async function loadUploadConfig() {
		configLoading = true;
		configError = '';

		try {
			uploadConfig = await apiClient.getUploadConfig('logo');
		} catch (err) {
			configError = err instanceof Error ? err.message : '설정 정보를 불러올 수 없습니다.';
			console.error('Failed to load upload config:', err);
		} finally {
			configLoading = false;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0] || null;

		// 파일 입력 초기화
		error = '';

		if (file) {
			// 설정이 로드되지 않은 경우 기본값 사용
			const defaultMaxSize = 5 * 1024 * 1024; // 5MB
			const defaultMaxSizeMB = 5;
			const defaultAllowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

			// 파일 타입 검증
			const allowedMimes = uploadConfig?.allowedMimes || defaultAllowedMimes;
			if (!allowedMimes.includes(file.type)) {
				const supportedFormats = allowedMimes
					.map((mime) => mime.split('/')[1].toUpperCase())
					.join(', ');
				error = `지원하지 않는 파일 형식입니다. 지원 형식: ${supportedFormats}`;
				// 파일 입력 초기화
				if (target) target.value = '';
				return;
			}

			// 파일 크기 검증
			const maxSize = uploadConfig?.maxSize || defaultMaxSize;
			const maxSizeMB = uploadConfig?.maxSizeMB || defaultMaxSizeMB;

			if (file.size > maxSize) {
				const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
				error = `파일 크기가 너무 큽니다. 현재: ${currentSizeMB}MB, 최대: ${maxSizeMB}MB`;
				// 파일 입력 초기화
				if (target) target.value = '';
				return;
			}

			selectedFile = file;

			// 미리보기 URL 생성
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			previewUrl = URL.createObjectURL(file);
		} else {
			selectedFile = null;
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				previewUrl = null;
			}
		}

		onFileSelect(selectedFile);
	}

	function handleRemove() {
		selectedFile = null;
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
		if (fileInput) {
			fileInput.value = '';
		}
		onFileSelect(null);
	}

	function handleRemoveExistingLogo() {
		if (onRemoveExistingLogo) {
			onRemoveExistingLogo();
		}
	}

	// existingLogoUri가 유효한 URL인지 확인하는 헬퍼 함수
	function isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	// 표시할 로고 URL를 계산하는 함수
	function getDisplayLogoUrl(): string | null {
		// 새로 선택된 파일의 미리보기가 있으면 우선 표시
		if (previewUrl) return previewUrl;

		// 기존 로고 URI가 있는지 확인
		if (existingLogoUri && existingLogoUri.trim()) {
			const trimmedUri = existingLogoUri.trim();

			// 빈 문자열이나 placeholder 값인 경우 null 반환
			if (trimmedUri === '' || trimmedUri === 'null' || trimmedUri === 'undefined') {
				return null;
			}

			// 상대 경로인 경우 백엔드 호스트를 붙임
			if (trimmedUri.startsWith('/uploads/')) {
				let url = `${env.API_BASE_URL}${trimmedUri}`;

				// 캐시 버스터가 있을 때만 추가
				if (cacheBuster) {
					url += `?v=${cacheBuster}`;
				}

				return url;
			}

			// 유효한 절대 URL인지 확인
			if (isValidUrl(trimmedUri)) {
				return trimmedUri;
			}
		}

		return null;
	}
</script>

<div class="space-y-4">
	{#if configLoading}
		<div class="flex items-center justify-center py-4">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
			<span class="ml-2 text-sm text-gray-600">설정 정보를 불러오는 중...</span>
		</div>
	{:else if configError}
		<div class="rounded-md border border-red-200 bg-red-50 p-3">
			<p class="text-sm text-red-600">{configError}</p>
			<Button type="button" variant="outline" size="sm" class="mt-2" onclick={loadUploadConfig}>
				다시 시도
			</Button>
		</div>
	{:else}
		<div>
			<p class="mb-1 block text-sm font-medium text-gray-700" aria-label="로고 이미지 업로드">
				로고 이미지
			</p>
			<div class="mt-1 flex w-full items-center space-x-4">
				<Button
					type="button"
					variant="outline"
					onclick={() => fileInput?.click()}
					disabled={isUploading}
					class="h-10 flex-shrink-0"
					aria-label="로고 파일 선택"
				>
					<i class="fas fa-upload mr-2"></i>
					파일 선택
				</Button>

				{#if selectedFile}
					<div class="flex min-w-0 flex-1 items-center space-x-2">
						<div class="min-w-0 flex-1">
							<span class="block truncate text-sm text-gray-600" title={selectedFile.name}>
								{truncateFileName(selectedFile.name)}
							</span>
							<span class="text-xs text-gray-400">
								{formatFileSize(selectedFile.size)}
							</span>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={handleRemove}
							disabled={isUploading}
							class="flex-shrink-0"
						>
							<i class="fas fa-times"></i>
						</Button>
					</div>
				{/if}
			</div>

			<input
				bind:this={fileInput}
				type="file"
				accept={uploadConfig ? uploadConfig.allowedMimes.join(',') : 'image/*'}
				onchange={handleFileSelect}
				class="hidden"
			/>

			{#if error}
				<p class="mt-1 text-sm text-red-600">{error}</p>
			{:else}
				<p class="mt-1 text-xs text-gray-500">
					{#if uploadConfig}
						지원 형식: {uploadConfig.allowedMimes
							.map((mime) => mime.split('/')[1].toUpperCase())
							.join(', ')} | 최대 크기: {uploadConfig.maxSizeMB}MB
					{:else}
						PNG, JPG, GIF 파일을 지원합니다. (최대 5MB)
					{/if}
				</p>
			{/if}
		</div>

		{#if getDisplayLogoUrl() && !imageLoadError}
			<div class="flex items-center space-x-4">
				<div class="relative">
					<img
						src={getDisplayLogoUrl()}
						alt="로고 미리보기"
						class="h-16 w-16 rounded-md border border-gray-300 object-contain"
						onerror={(e) => {
							console.log('이미지 로딩 실패:', getDisplayLogoUrl());
							imageLoadError = true;
							// 이미지 로딩 실패 시 해당 이미지 요소를 숨김
							if (e.target instanceof HTMLImageElement) {
								e.target.style.display = 'none';
							}
						}}
						onload={() => {
							imageLoadError = false;
						}}
					/>
					{#if previewUrl && existingLogoUri && existingLogoUri.trim()}
						<span
							class="absolute -top-2 -right-2 rounded bg-blue-500 px-1 py-0.5 text-xs text-white"
						>
							새 로고
						</span>
					{/if}
				</div>
				<div class="flex-1">
					<p class="text-sm text-gray-600">
						{#if isUploading}
							<i class="fas fa-spinner fa-spin mr-2 text-blue-500"></i>
							<span class="font-medium text-blue-600">로고를 업로드하고 있습니다...</span>
						{:else if previewUrl}
							<i class="fas fa-clock mr-2 text-orange-500"></i>
							저장 시 자동으로 업로드됩니다.
						{:else if existingLogoUri && existingLogoUri.trim()}
							<i class="fas fa-check-circle mr-2 text-green-500"></i>
							등록된 로고
						{/if}
					</p>
					{#if previewUrl && existingLogoUri && existingLogoUri.trim()}
						<p class="mt-1 text-xs text-blue-600">새 로고로 교체됩니다.</p>
					{/if}
					{#if !previewUrl && existingLogoUri && existingLogoUri.trim() && onRemoveExistingLogo}
						<div class="mt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={handleRemoveExistingLogo}
								disabled={isUploading}
								class="text-red-600 hover:border-red-300 hover:text-red-700"
							>
								<i class="fas fa-trash mr-1"></i>
								로고 제거
							</Button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- 로고가 없을 때 표시할 상태 메시지 (선택사항) -->
			<div class="py-2 text-sm text-gray-500">
				<i class="fas fa-image mr-2"></i>
				등록된 로고가 없습니다.
			</div>
		{/if}
	{/if}
</div>
