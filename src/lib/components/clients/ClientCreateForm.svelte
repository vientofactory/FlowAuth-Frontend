<script lang="ts">
	import { Card, Button, Loading, LogoUpload } from '$lib';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import { env } from '$lib/config/env';
	import { load } from 'recaptcha-v3';

	interface Props {
		showCreateForm: boolean;
		isCreating: boolean;
		clientNameValue: string;
		clientDescriptionValue: string;
		redirectUrisValue: string;
		scopesValue: string;
		selectedScopes: string[];
		logoUriValue: string;
		termsOfServiceUriValue: string;
		policyUriValue: string;
		clientNameError: string;
		redirectUrisError: string;
		scopesError: string;
		logoUriError: string;
		termsOfServiceUriError: string;
		policyUriError: string;
		selectedLogoFile: File | null;
		logoPreviewUrl: string | null;
		cacheBuster?: string;
		recaptchaToken?: string;
		onToggleCreateForm: () => void;
		onCreateClient: () => void;
		onScopeToggle: (scope: string) => void;
	}

	let {
		showCreateForm,
		isCreating,
		clientNameValue = $bindable(),
		clientDescriptionValue = $bindable(),
		redirectUrisValue = $bindable(),
		scopesValue = $bindable(),
		selectedScopes = $bindable([]),
		logoUriValue = $bindable(),
		termsOfServiceUriValue = $bindable(),
		policyUriValue = $bindable(),
		clientNameError,
		redirectUrisError,
		scopesError,
		logoUriError: _logoUriError,
		termsOfServiceUriError,
		policyUriError,
		selectedLogoFile = $bindable(),
		logoPreviewUrl = $bindable(),
		cacheBuster = '',
		recaptchaToken = $bindable(''),
		onToggleCreateForm,
		onCreateClient,
		onScopeToggle
	}: Props = $props();

	const { success: _success } = useToast();

	let _recaptchaInstance: unknown = null;

	onMount(() => {
		// reCAPTCHA 초기화
		if (env.RECAPTCHA_SITE_KEY) {
			load(env.RECAPTCHA_SITE_KEY)
				.then((instance) => {
					_recaptchaInstance = instance;
				})
				.catch((error) => {
					console.error('reCAPTCHA 초기화 실패:', error);
				});
		}
	});

	function handleLogoFileSelect(file: File | null) {
		selectedLogoFile = file;
		if (!file && logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}
	}
</script>

{#if showCreateForm}
	<Card class="mb-4 sm:mb-6">
		<div class="p-4 sm:p-6">
			<h3 class="mb-4 text-base font-semibold text-gray-900 sm:text-lg">새 클라이언트 생성</h3>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					onCreateClient();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="sm:col-span-2">
						<label for="clientName" class="mb-1 block text-sm font-medium text-gray-700">
							클라이언트 이름 *
						</label>
						<input
							id="clientName"
							bind:value={clientNameValue}
							placeholder="클라이언트 애플리케이션 이름"
							required
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
						/>
						{#if clientNameError}
							<p class="mt-1 text-sm text-red-600">{clientNameError}</p>
						{/if}
					</div>

					<div class="sm:col-span-2">
						<label for="clientDescription" class="mb-1 block text-sm font-medium text-gray-700">
							설명
						</label>
						<input
							id="clientDescription"
							bind:value={clientDescriptionValue}
							placeholder="클라이언트 애플리케이션 설명"
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
						/>
					</div>

					<div class="sm:col-span-2">
						<label for="redirectUris" class="mb-1 block text-sm font-medium text-gray-700">
							리다이렉트 URI *
						</label>
						<textarea
							id="redirectUris"
							bind:value={redirectUrisValue}
							placeholder="https://example.com/callback"
							rows="3"
							required
							class="h-20 w-full rounded-md border-gray-300 px-3 py-2 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-24"
						></textarea>
						{#if redirectUrisError}
							<p class="mt-1 text-sm text-red-600">{redirectUrisError}</p>
						{:else}
							<p class="mt-1 text-xs text-gray-500">한 줄에 하나씩 입력해주세요.</p>
						{/if}
					</div>

					<div class="sm:col-span-2">
						<ScopeSelector
							bind:selectedScopes
							{onScopeToggle}
							error={scopesError}
							disabled={isCreating}
						/>
					</div>

					<div class="sm:col-span-2">
						<LogoUpload
							selectedFile={selectedLogoFile}
							previewUrl={logoPreviewUrl}
							isUploading={isCreating}
							existingLogoUri={logoUriValue}
							onFileSelect={handleLogoFileSelect}
							{cacheBuster}
						/>
					</div>

					<div>
						<label for="termsOfServiceUri" class="mb-1 block text-sm font-medium text-gray-700">
							이용약관 URL
						</label>
						<input
							id="termsOfServiceUri"
							bind:value={termsOfServiceUriValue}
							placeholder="https://example.com/terms"
							type="url"
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
						/>
						{#if termsOfServiceUriError}
							<p class="mt-1 text-sm text-red-600">{termsOfServiceUriError}</p>
						{:else}
							<p class="mt-1 text-xs text-gray-500">이용약관 페이지 URL (선택사항)</p>
						{/if}
					</div>

					<div>
						<label for="policyUri" class="mb-1 block text-sm font-medium text-gray-700">
							개인정보처리방침 URL
						</label>
						<input
							id="policyUri"
							bind:value={policyUriValue}
							placeholder="https://example.com/privacy"
							type="url"
							class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
						/>
						{#if policyUriError}
							<p class="mt-1 text-sm text-red-600">{policyUriError}</p>
						{:else}
							<p class="mt-1 text-xs text-gray-500">개인정보처리방침 페이지 URL (선택사항)</p>
						{/if}
					</div>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onclick={onToggleCreateForm}
						disabled={isCreating}
						class="h-10 w-full sm:h-11 sm:w-auto"
					>
						취소
					</Button>
					<Button type="submit" disabled={isCreating} class="h-10 w-full sm:h-11 sm:w-auto">
						{#if isCreating}
							<Loading class="mr-2" />
							생성 중...
						{:else}
							<i class="fas fa-plus mr-2"></i>
							생성
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</Card>
{/if}
