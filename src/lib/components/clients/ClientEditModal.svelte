<script lang="ts">
	import { Modal, Button, LogoUpload, ActionButton } from '$lib';
	import ScopeSelector from '$lib/components/ScopeSelector.svelte';
	import type { Client } from '$lib/types/oauth.types';
	import { faSave } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		showEditModal: boolean;
		clientToEdit: Client | null;
		editClientName: string;
		editClientDescription: string;
		editRedirectUris: string;
		editScopes: string;
		selectedScopes: string[];
		editLogoUri: string;
		editTermsOfServiceUri: string;
		editPolicyUri: string;
		editClientNameError: string;
		editRedirectUrisError: string;
		editScopesError: string;
		editLogoUriError: string;
		editTermsOfServiceUriError: string;
		editPolicyUriError: string;
		selectedLogoFile: File | null;
		logoPreviewUrl: string | null;
		isUpdating: boolean;
		logoCacheBuster?: string;
		onClose: () => void;
		onUpdateClient: () => void;
		onRemoveClientLogo?: () => void;
		onRestoreClientLogo?: () => void;
		logoMarkedForDeletion?: boolean;
		onScopeToggle: (scope: string) => void;
	}

	let {
		showEditModal,
		clientToEdit,
		editClientName = $bindable(),
		editClientDescription = $bindable(),
		editRedirectUris = $bindable(),
		editScopes = $bindable(),
		selectedScopes = $bindable([]),
		editLogoUri = $bindable(),
		editTermsOfServiceUri = $bindable(),
		editPolicyUri = $bindable(),
		editClientNameError,
		editRedirectUrisError,
		editScopesError,
		editLogoUriError,
		editTermsOfServiceUriError,
		editPolicyUriError,
		selectedLogoFile = $bindable(),
		logoPreviewUrl = $bindable(),
		isUpdating,
		logoCacheBuster = '',
		onClose,
		onUpdateClient,
		onRemoveClientLogo,
		onRestoreClientLogo,
		logoMarkedForDeletion = false,
		onScopeToggle
	}: Props = $props();

	function handleLogoFileSelect(file: File | null) {
		selectedLogoFile = file;
		if (!file && logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}
	}
</script>

<Modal open={showEditModal && !!clientToEdit} title="클라이언트 정보 수정" {onClose}>
	<div class="space-y-4">
		<form
			id="edit-client-form"
			onsubmit={(e) => {
				e.preventDefault();
				onUpdateClient();
			}}
			class="space-y-4"
		>
			<div>
				<label for="editClientName" class="mb-1 block text-sm font-medium text-gray-700">
					클라이언트 이름 *
				</label>
				<input
					id="editClientName"
					bind:value={editClientName}
					placeholder="클라이언트 애플리케이션 이름"
					required
					class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
				/>
				{#if editClientNameError}
					<p class="mt-1 text-sm text-red-600">{editClientNameError}</p>
				{/if}
			</div>

			<div>
				<label for="editClientDescription" class="mb-1 block text-sm font-medium text-gray-700">
					설명
				</label>
				<input
					id="editClientDescription"
					bind:value={editClientDescription}
					placeholder="클라이언트 애플리케이션 설명"
					class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
				/>
			</div>

			<div>
				<label for="editRedirectUris" class="mb-1 block text-sm font-medium text-gray-700">
					리다이렉트 URI *
				</label>
				<textarea
					id="editRedirectUris"
					bind:value={editRedirectUris}
					placeholder="https://example.com/callback"
					rows="3"
					required
					class="h-20 w-full rounded-md border-gray-300 px-3 py-2 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-24"
				></textarea>
				{#if editRedirectUrisError}
					<p class="mt-1 text-sm text-red-600">{editRedirectUrisError}</p>
				{:else}
					<p class="mt-1 text-xs text-gray-500">한 줄에 하나씩 입력해주세요.</p>
				{/if}
			</div>

			<div>
				<ScopeSelector
					bind:selectedScopes
					{onScopeToggle}
					error={editScopesError}
					disabled={isUpdating}
				/>
			</div>

			<div>
				<LogoUpload
					selectedFile={selectedLogoFile}
					previewUrl={logoPreviewUrl}
					isUploading={isUpdating}
					existingLogoUri={editLogoUri || ''}
					onFileSelect={handleLogoFileSelect}
					onRemoveExistingLogo={onRemoveClientLogo}
					onRestoreExistingLogo={onRestoreClientLogo}
					{logoMarkedForDeletion}
					cacheBuster={logoCacheBuster}
				/>
				{#if editLogoUriError}
					<p class="mt-1 text-sm text-red-600">{editLogoUriError}</p>
				{/if}
			</div>

			<div>
				<label for="editTermsOfServiceUri" class="mb-1 block text-sm font-medium text-gray-700">
					이용약관 URL
				</label>
				<input
					id="editTermsOfServiceUri"
					bind:value={editTermsOfServiceUri}
					placeholder="https://example.com/terms"
					type="url"
					class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
				/>
				{#if editTermsOfServiceUriError}
					<p class="mt-1 text-sm text-red-600">{editTermsOfServiceUriError}</p>
				{:else}
					<p class="mt-1 text-xs text-gray-500">이용약관 페이지 URL (선택사항)</p>
				{/if}
			</div>

			<div>
				<label for="editPolicyUri" class="mb-1 block text-sm font-medium text-gray-700">
					개인정보처리방침 URL
				</label>
				<input
					id="editPolicyUri"
					bind:value={editPolicyUri}
					placeholder="https://example.com/privacy"
					type="url"
					class="h-10 w-full rounded-md border-gray-300 px-3 text-base shadow-sm focus:border-stone-500 focus:ring-stone-500 sm:h-11"
				/>
				{#if editPolicyUriError}
					<p class="mt-1 text-sm text-red-600">{editPolicyUriError}</p>
				{:else}
					<p class="mt-1 text-xs text-gray-500">개인정보처리방침 페이지 URL (선택사항)</p>
				{/if}
			</div>
		</form>
	</div>

	{#snippet footer()}
		<Button
			type="button"
			variant="outline"
			onclick={onClose}
			disabled={isUpdating}
			class="h-10 w-full sm:h-11 sm:w-auto"
		>
			취소
		</Button>
		<ActionButton
			loading={isUpdating}
			loadingText="수정 중..."
			defaultText="수정"
			defaultIcon={faSave}
			variant="primary"
			size="md"
			class="h-10 w-full sm:h-11 sm:w-auto"
			onclick={() => {
				const form = document.getElementById('edit-client-form') as HTMLFormElement;
				if (form) form.requestSubmit();
			}}
		/>
	{/snippet}
</Modal>
