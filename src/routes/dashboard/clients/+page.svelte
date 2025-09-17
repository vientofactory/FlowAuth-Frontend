<script lang="ts">
	import { DashboardLayout, Button, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Client } from '$lib/types/oauth.types';
	import {
		validateClientName,
		validateRedirectUri,
		validateUrl,
		validateScopes
	} from '$lib/utils/validation.utils';
	import ClientStats from '$lib/components/clients/ClientStats.svelte';
	import ClientCreateForm from '$lib/components/clients/ClientCreateForm.svelte';
	import ClientList from '$lib/components/clients/ClientList.svelte';
	import ClientSecretModal from '$lib/components/clients/ClientSecretModal.svelte';
	import ClientDeleteModal from '$lib/components/clients/ClientDeleteModal.svelte';
	import ClientEditModal from '$lib/components/clients/ClientEditModal.svelte';

	let clients = $state<Client[]>([]);
	let isLoading = $state(true);

	let showCreateForm = $state(false);
	let isCreating = $state(false);
	let newClient = $state({
		name: '',
		description: '',
		redirectUris: '',
		grants: ['authorization_code'],
		scopes: 'read write',
		logoUri: '',
		termsOfServiceUri: '',
		policyUri: ''
	});

	let showSecretModal = $state(false);
	let createdClientSecret = $state('');

	let showEditModal = $state(false);
	let clientToEdit = $state<Client | null>(null);

	// 수정 폼 값들
	let editClientName = $state('');
	let editClientDescription = $state('');
	let editRedirectUris = $state('');
	let editScopes = $state('');
	let editLogoUri = $state('');
	let editTermsOfServiceUri = $state('');
	let editPolicyUri = $state('');

	// 삭제 관련
	let showDeleteModal = $state(false);
	let clientToDelete = $state<Client | null>(null);

	// 디버깅을 위한 reactive 값들
	let clientNameValue = $state('');
	let clientDescriptionValue = $state('');
	let redirectUrisValue = $state('');
	let scopesValue = $state('read write');
	let logoUriValue = $state('');
	let termsOfServiceUriValue = $state('');
	let policyUriValue = $state('');

	// 폼 검증 상태 (등록 폼)
	let clientNameError = $state('');
	let redirectUrisError = $state('');
	let scopesError = $state('');
	let logoUriError = $state('');
	let termsOfServiceUriError = $state('');
	let policyUriError = $state('');

	// 폼 검증 상태 (수정 폼)
	let editClientNameError = $state('');
	let editRedirectUrisError = $state('');
	let editScopesError = $state('');
	let editLogoUriError = $state('');
	let editTermsOfServiceUriError = $state('');
	let editPolicyUriError = $state('');

	// 값 동기화 및 초기화
	$effect(() => {
		if (newClient.name !== undefined) {
			clientNameValue = newClient.name || '';
		}
	});

	$effect(() => {
		if (newClient.description !== undefined) {
			clientDescriptionValue = newClient.description || '';
		}
	});

	$effect(() => {
		if (newClient.redirectUris !== undefined) {
			redirectUrisValue = newClient.redirectUris || '';
		}
	});

	$effect(() => {
		if (newClient.scopes !== undefined) {
			scopesValue = newClient.scopes || 'read write';
		}
	});

	$effect(() => {
		if (newClient.logoUri !== undefined) {
			logoUriValue = newClient.logoUri || '';
		}
	});

	$effect(() => {
		if (newClient.termsOfServiceUri !== undefined) {
			termsOfServiceUriValue = newClient.termsOfServiceUri || '';
		}
	});

	$effect(() => {
		if (newClient.policyUri !== undefined) {
			policyUriValue = newClient.policyUri || '';
		}
	});

	$effect(() => {
		if (newClient.termsOfServiceUri !== undefined) {
			termsOfServiceUriValue = newClient.termsOfServiceUri || '';
		}
	});

	$effect(() => {
		if (newClient.policyUri !== undefined) {
			policyUriValue = newClient.policyUri || '';
		}
	});

	// 초기화 보장
	onMount(() => {
		clientNameValue = '';
		clientDescriptionValue = '';
		redirectUrisValue = '';
		scopesValue = 'read write';
		logoUriValue = '';
		termsOfServiceUriValue = '';
		policyUriValue = '';
	});

	const toast = useToast();

	// 검증 함수들 (등록 폼)
	function validateClientNameField() {
		const result = validateClientName(clientNameValue);
		clientNameError = result.isValid ? '' : result.message || '';
	}

	function validateRedirectUrisField() {
		if (!redirectUrisValue.trim()) {
			redirectUrisError = '리다이렉트 URI를 입력해주세요.';
			return;
		}

		const uris = redirectUrisValue
			.split('\n')
			.map((uri) => uri.trim())
			.filter((uri) => uri.length > 0);

		if (uris.length === 0) {
			redirectUrisError = '최소 하나의 리다이렉트 URI를 입력해주세요.';
			return;
		}

		for (const uri of uris) {
			const result = validateRedirectUri(uri);
			if (!result.isValid) {
				redirectUrisError = result.message || '올바르지 않은 리다이렉트 URI가 있습니다.';
				return;
			}
		}

		redirectUrisError = '';
	}

	function validateScopesField() {
		if (!scopesValue.trim()) {
			scopesError = '권한 범위를 입력해주세요.';
			return;
		}

		const scopes = scopesValue
			.split(' ')
			.map((scope) => scope.trim())
			.filter((scope) => scope.length > 0);

		const result = validateScopes(scopes);
		scopesError = result.isValid ? '' : result.message || '';
	}

	function validateLogoUriField() {
		const result = validateUrl(logoUriValue, '로고 URL');
		logoUriError = result.isValid ? '' : result.message || '';
	}

	function validateTermsOfServiceUriField() {
		const result = validateUrl(termsOfServiceUriValue, '서비스 약관 URL');
		termsOfServiceUriError = result.isValid ? '' : result.message || '';
	}

	function validatePolicyUriField() {
		const result = validateUrl(policyUriValue, '개인정보처리방침 URL');
		policyUriError = result.isValid ? '' : result.message || '';
	}

	// 검증 함수들 (수정 폼)
	function validateEditClientNameField() {
		const result = validateClientName(editClientName);
		editClientNameError = result.isValid ? '' : result.message || '';
	}

	function validateEditRedirectUrisField() {
		if (!editRedirectUris.trim()) {
			editRedirectUrisError = '리다이렉트 URI를 입력해주세요.';
			return;
		}

		const uris = editRedirectUris
			.split('\n')
			.map((uri) => uri.trim())
			.filter((uri) => uri.length > 0);

		if (uris.length === 0) {
			editRedirectUrisError = '최소 하나의 리다이렉트 URI를 입력해주세요.';
			return;
		}

		for (const uri of uris) {
			const result = validateRedirectUri(uri);
			if (!result.isValid) {
				editRedirectUrisError = result.message || '올바르지 않은 리다이렉트 URI가 있습니다.';
				return;
			}
		}

		editRedirectUrisError = '';
	}

	function validateEditScopesField() {
		if (!editScopes.trim()) {
			editScopesError = '권한 범위를 입력해주세요.';
			return;
		}

		const scopes = editScopes
			.split(' ')
			.map((scope) => scope.trim())
			.filter((scope) => scope.length > 0);

		const result = validateScopes(scopes);
		editScopesError = result.isValid ? '' : result.message || '';
	}

	function validateEditLogoUriField() {
		const result = validateUrl(editLogoUri, '로고 URL');
		editLogoUriError = result.isValid ? '' : result.message || '';
	}

	function validateEditTermsOfServiceUriField() {
		const result = validateUrl(editTermsOfServiceUri, '서비스 약관 URL');
		editTermsOfServiceUriError = result.isValid ? '' : result.message || '';
	}

	function validateEditPolicyUriField() {
		const result = validateUrl(editPolicyUri, '개인정보처리방침 URL');
		editPolicyUriError = result.isValid ? '' : result.message || '';
	}

	onMount(async () => {
		await loadClients();
	});

	async function loadClients() {
		try {
			isLoading = true;
			const response = await apiClient.getClients();
			clients = Array.isArray(response) ? response : [];
		} catch (error) {
			console.error('Failed to load clients:', error);
			toast.error('클라이언트 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoading = false;
		}
	}

	function toggleCreateForm() {
		showCreateForm = !showCreateForm;
		if (!showCreateForm) {
			resetForm();
		}
	}

	function resetForm() {
		clientNameValue = '';
		clientDescriptionValue = '';
		redirectUrisValue = '';
		scopesValue = 'read write';
		logoUriValue = '';
		termsOfServiceUriValue = '';
		policyUriValue = '';
		newClient = {
			name: '',
			description: '',
			redirectUris: '',
			grants: ['authorization_code'],
			scopes: 'read write',
			logoUri: '',
			termsOfServiceUri: '',
			policyUri: ''
		};
	}

	async function createClient() {
		// 모든 필드 검증 수행
		validateClientNameField();
		validateRedirectUrisField();
		validateScopesField();
		validateLogoUriField();
		validateTermsOfServiceUriField();
		validatePolicyUriField();

		// 검증 실패 시 중단
		if (
			clientNameError ||
			redirectUrisError ||
			scopesError ||
			logoUriError ||
			termsOfServiceUriError ||
			policyUriError
		) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		isCreating = true;

		try {
			const redirectUris = redirectUrisValue
				.split('\n')
				.map((uri) => uri.trim())
				.filter((uri) => uri.length > 0);

			const scopes = scopesValue
				.split(' ')
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0);

			const response = (await apiClient.createClient({
				name: clientNameValue,
				description: clientDescriptionValue || undefined,
				redirectUris,
				grants: newClient.grants,
				scopes,
				logoUri: logoUriValue || undefined,
				termsOfServiceUri: termsOfServiceUriValue || undefined,
				policyUri: policyUriValue || undefined
			})) as { clientSecret: string };

			createdClientSecret = response.clientSecret;
			showSecretModal = true;

			toast.success('클라이언트가 성공적으로 생성되었습니다.');

			showCreateForm = false;
			resetForm();
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to create client:', error);
			toast.error('클라이언트 생성에 실패했습니다.');
		}
	}

	async function deleteClient(clientId: number) {
		const client = clients.find((c) => c.id === clientId);
		if (!client) return;

		clientToDelete = client;
		showDeleteModal = true;
	}

	async function editClient(client: Client) {
		clientToEdit = client;
		editClientName = client.name;
		editClientDescription = client.description || '';
		editRedirectUris = client.redirectUris.join('\n');
		editScopes = client.scopes ? client.scopes.join(' ') : 'read write';
		editLogoUri = client.logoUri || '';
		editTermsOfServiceUri = client.termsOfServiceUri || '';
		editPolicyUri = client.policyUri || '';
		showEditModal = true;
	}

	async function updateClient() {
		if (!clientToEdit) return;

		// 모든 필드 검증 수행
		validateEditClientNameField();
		validateEditRedirectUrisField();
		validateEditScopesField();
		validateEditLogoUriField();
		validateEditTermsOfServiceUriField();
		validateEditPolicyUriField();

		// 검증 실패 시 중단
		if (
			editClientNameError ||
			editRedirectUrisError ||
			editScopesError ||
			editLogoUriError ||
			editTermsOfServiceUriError ||
			editPolicyUriError
		) {
			toast.warning('입력 정보를 확인해주세요.');
			return;
		}

		try {
			const redirectUris = editRedirectUris
				.split('\n')
				.map((uri) => uri.trim())
				.filter((uri) => uri.length > 0);

			const scopes = editScopes
				.split(' ')
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0);

			await apiClient.updateClient(clientToEdit.id, {
				name: editClientName,
				description: editClientDescription || undefined,
				redirectUris,
				scopes,
				logoUri: editLogoUri || undefined,
				termsOfServiceUri: editTermsOfServiceUri || undefined,
				policyUri: editPolicyUri || undefined
			});

			toast.success('클라이언트가 성공적으로 수정되었습니다.');
			showEditModal = false;
			clientToEdit = null;
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to update client:', error);
			toast.error('클라이언트 수정에 실패했습니다.');
		}
	}

	async function toggleClientStatus(client: Client) {
		try {
			await apiClient.updateClientStatus(client.id, !client.isActive);
			toast.success(`클라이언트가 ${!client.isActive ? '활성화' : '비활성화'} 되었습니다.`);
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to update client status:', error);
			toast.error('클라이언트 상태 변경에 실패했습니다.');
		}
	}

	async function confirmDeleteClient() {
		if (!clientToDelete) return;

		try {
			await apiClient.deleteClient(clientToDelete.id);
			toast.success('클라이언트가 성공적으로 삭제되었습니다.');
			showDeleteModal = false;
			clientToDelete = null;
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to delete client:', error);
			toast.error('클라이언트 삭제에 실패했습니다.');
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('클립보드에 복사되었습니다.');
	}

	// 임시 디버깅 함수들
	function debugToken() {
		apiClient.debugToken();
	}

	function clearTokens() {
		apiClient.clearAllTokens();
		toast.success('모든 토큰이 제거되었습니다. 다시 로그인해주세요.');
	}

	async function refreshToken() {
		try {
			await apiClient.refreshToken();
			toast.success('토큰이 확인되었습니다.');
		} catch {
			toast.error('토큰 새로고침에 실패했습니다. 다시 로그인해주세요.');
		}
	}
</script>

<DashboardLayout
	title="클라이언트 관리"
	description="OAuth2 클라이언트 애플리케이션을 관리하고 설정하세요."
>
	{#snippet headerActions()}
		<div class="flex flex-col gap-2 sm:flex-row">
			<!-- 모바일에서는 기본 액션만 표시 -->
			<div class="flex gap-2 lg:hidden">
				<Button onclick={toggleCreateForm} class="flex-1 sm:flex-none min-w-0">
					<i class="fas fa-plus mr-1 sm:mr-2"></i>
					<span class="truncate">{showCreateForm ? '취소' : '클라이언트 추가'}</span>
				</Button>
			</div>
			<!-- 데스크톱에서는 모든 액션 표시 -->
			<div class="hidden gap-2 lg:flex">
				<Button variant="outline" onclick={debugToken}>
					<i class="fas fa-bug mr-2"></i>
					토큰 디버그
				</Button>
				<Button variant="outline" onclick={refreshToken}>
					<i class="fas fa-sync mr-2"></i>
					토큰 확인
				</Button>
				<Button variant="outline" onclick={clearTokens}>
					<i class="fas fa-trash mr-2"></i>
					토큰 초기화
				</Button>
				<Button onclick={toggleCreateForm} class="whitespace-nowrap">
					<i class="fas fa-plus mr-2"></i>
					{showCreateForm ? '취소' : '새 클라이언트 생성'}
				</Button>
			</div>
		</div>
	{/snippet}

	<ClientStats {clients} />

	<ClientCreateForm
		{showCreateForm}
		{isCreating}
		bind:clientNameValue
		bind:clientDescriptionValue
		bind:redirectUrisValue
		bind:scopesValue
		bind:logoUriValue
		bind:termsOfServiceUriValue
		bind:policyUriValue
		{clientNameError}
		{redirectUrisError}
		{scopesError}
		{logoUriError}
		{termsOfServiceUriError}
		{policyUriError}
		onToggleCreateForm={toggleCreateForm}
		onCreateClient={createClient}
	/>

	<ClientList
		{clients}
		{isLoading}
		onToggleCreateForm={toggleCreateForm}
		onEditClient={editClient}
		onToggleClientStatus={toggleClientStatus}
		onDeleteClient={deleteClient}
		onCopyToClipboard={copyToClipboard}
	/>
</DashboardLayout>

<ClientSecretModal
	{showSecretModal}
	{createdClientSecret}
	onClose={() => (showSecretModal = false)}
	onCopyToClipboard={copyToClipboard}
/>

<ClientDeleteModal
	{showDeleteModal}
	{clientToDelete}
	onClose={() => {
		showDeleteModal = false;
		clientToDelete = null;
	}}
	onConfirmDelete={confirmDeleteClient}
/>

<ClientEditModal
	{showEditModal}
	{clientToEdit}
	bind:editClientName
	bind:editClientDescription
	bind:editRedirectUris
	bind:editScopes
	bind:editLogoUri
	bind:editTermsOfServiceUri
	bind:editPolicyUri
	{editClientNameError}
	{editRedirectUrisError}
	{editScopesError}
	{editLogoUriError}
	{editTermsOfServiceUriError}
	{editPolicyUriError}
	onClose={() => {
		showEditModal = false;
		clientToEdit = null;
	}}
	onUpdateClient={updateClient}
/>
