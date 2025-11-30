<script lang="ts">
	import { DashboardLayout, Button, apiClient, DashboardSkeleton } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Client } from '$lib/types/oauth.types';
	import type { User } from '$lib';
	import { USER_TYPES } from '$lib';
	import { authState } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { env } from '$lib/config/env';
	import { load, type ReCaptchaInstance } from 'recaptcha-v3';
	import {
		validateClientNameField as validateClientNameUtil,
		validateRedirectUrisField as validateRedirectUrisUtil,
		validateScopesField as validateScopesUtil,
		validateLogoUriField as validateLogoUtil,
		validateTermsOfServiceUriField as validateTermsUtil,
		validatePolicyUriField as validatePolicyUtil,
		validateEditClientNameField as validateEditClientNameUtil,
		validateEditRedirectUrisField as validateEditRedirectUrisUtil,
		validateEditScopesField as validateEditScopesUtil,
		validateEditLogoUriField as validateEditLogoUtil,
		validateEditTermsOfServiceUriField as validateEditTermsUtil,
		validateEditPolicyUriField as validateEditPolicyUtil
	} from '$lib/utils/client-validation.utils';
	import ClientStats from '$lib/components/clients/ClientStats.svelte';
	import ClientCreateForm from '$lib/components/clients/ClientCreateForm.svelte';
	import ClientList from '$lib/components/clients/ClientList.svelte';
	import ClientSecretModal from '$lib/components/clients/ClientSecretModal.svelte';
	import ClientSecretResetModal from '$lib/components/clients/ClientSecretResetModal.svelte';
	import ClientDeleteModal from '$lib/components/clients/ClientDeleteModal.svelte';
	import ClientEditModal from '$lib/components/clients/ClientEditModal.svelte';
	import ClientStatusModal from '$lib/components/clients/ClientStatusModal.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faPlus, faCode, faBook, faMinus } from '@fortawesome/free-solid-svg-icons';
	import { faGithub } from '@fortawesome/free-brands-svg-icons';

	let user = $state<User | null>(null);
	let clients = $state<Client[]>([]);
	let isLoading = $state(true);

	let showCreateForm = $state(false);
	let isCreating = $state(false);
	let isUpdating = $state(false);
	let isDeleting = $state(false);
	let newClient = $state({
		name: '',
		description: '',
		redirectUris: '',
		grants: ['authorization_code'],
		scopes: 'openid profile',
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

	// 시크릿 재설정 관련
	let showSecretResetModal = $state(false);
	let clientToResetSecret = $state<Client | null>(null);
	let isResettingSecret = $state(false);
	let newResetSecret = $state('');

	// 상태 변경 관련
	let showStatusModal = $state(false);
	let clientToChangeStatus = $state<Client | null>(null);
	let isChangingStatus = $state(false);

	// 디버깅을 위한 reactive 값들
	let clientNameValue = $state('');
	let clientDescriptionValue = $state('');
	let redirectUrisValue = $state('');
	let scopesValue = $state('read write');
	let logoUriValue = $state('');
	let termsOfServiceUriValue = $state('');
	let policyUriValue: string = $state('');

	let selectedScopes = $state<string[]>([]);
	let editSelectedScopes = $state<string[]>([]);

	// 로고 업로드 관련
	let selectedLogoFile = $state<File | null>(null);
	let logoPreviewUrl = $state<string | null>(null);
	let logoCacheBuster = $state('');

	// 로고 삭제 관련 (낙관적 업데이트용)
	let logoMarkedForDeletion = $state(false);

	// reCAPTCHA 관련
	let recaptchaToken = $state('');
	let recaptchaInstance: ReCaptchaInstance | null = null;

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
			scopesValue = newClient.scopes || 'profile';
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
		scopesValue = 'openid profile';
		selectedScopes = ['openid', 'profile'];
		logoUriValue = '';
		termsOfServiceUriValue = '';
		policyUriValue = '';
	});

	const toast = useToast();

	// 검증 함수들 (등록 폼)
	function validateClientNameField() {
		const result = validateClientNameUtil(clientNameValue);
		clientNameError = result.message || '';
	}

	function validateRedirectUrisField() {
		const result = validateRedirectUrisUtil(redirectUrisValue);
		redirectUrisError = result.message || '';
	}

	async function validateScopesField() {
		const result = await validateScopesUtil(scopesValue);
		scopesError = result.message || '';
	}

	function validateLogoUriField() {
		const result = validateLogoUtil(logoUriValue);
		logoUriError = result.message || '';
	}

	function validateTermsOfServiceUriField() {
		const result = validateTermsUtil(termsOfServiceUriValue);
		termsOfServiceUriError = result.message || '';
	}

	function validatePolicyUriField() {
		const result = validatePolicyUtil(policyUriValue);
		policyUriError = result.message || '';
	}

	// 검증 함수들 (수정 폼)
	function validateEditClientNameField() {
		const result = validateEditClientNameUtil(editClientName);
		editClientNameError = result.message || '';
	}

	function validateEditRedirectUrisField() {
		const result = validateEditRedirectUrisUtil(editRedirectUris);
		editRedirectUrisError = result.message || '';
	}

	async function validateEditScopesField() {
		const result = await validateEditScopesUtil(editScopes);
		editScopesError = result.message || '';
	}

	function validateEditLogoUriField() {
		const result = validateEditLogoUtil(editLogoUri);
		editLogoUriError = result.message || '';
	}

	function validateEditTermsOfServiceUriField() {
		const result = validateEditTermsUtil(editTermsOfServiceUri);
		editTermsOfServiceUriError = result.message || '';
	}

	function validateEditPolicyUriField() {
		const result = validateEditPolicyUtil(editPolicyUri);
		editPolicyUriError = result.message || '';
	}

	onMount(() => {
		// 사용자 유형 검증
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			if (user && user.userType !== USER_TYPES.DEVELOPER) {
				// 일반 사용자는 접근 불가
				goto('/dashboard');
				return;
			}
		});

		loadClients();

		// reCAPTCHA 초기화
		if (env.RECAPTCHA_SITE_KEY) {
			load(env.RECAPTCHA_SITE_KEY)
				.then((instance) => {
					recaptchaInstance = instance;
				})
				.catch((error) => {
					console.error('reCAPTCHA 초기화 실패:', error);
				});
		}

		// cleanup 함수 반환
		return () => {
			unsubscribe();
		};
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
		scopesValue = 'openid profile';
		selectedScopes = ['openid', 'profile'];
		logoUriValue = '';
		termsOfServiceUriValue = '';
		policyUriValue = '';

		// 로고 업로드 상태 초기화
		selectedLogoFile = null;
		if (logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}

		newClient = {
			name: '',
			description: '',
			redirectUris: '',
			grants: ['authorization_code'],
			scopes: 'profile',
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
			// reCAPTCHA 검증 (필수)
			if (!env.RECAPTCHA_SITE_KEY) {
				toast.error('reCAPTCHA가 설정되지 않았습니다. 관리자에게 문의해주세요.');
				isCreating = false;
				return;
			}
			if (!recaptchaInstance) {
				toast.error('reCAPTCHA가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
				isCreating = false;
				return;
			}
			try {
				recaptchaToken = await recaptchaInstance.execute('createClient');
			} catch {
				toast.error('reCAPTCHA 검증에 실패했습니다. 다시 시도해주세요.');
				isCreating = false;
				return;
			}

			// 로고 파일이 선택된 경우 먼저 업로드
			if (selectedLogoFile) {
				try {
					const uploadResult = await apiClient.uploadLogo(selectedLogoFile);
					if (uploadResult.success) {
						logoUriValue = uploadResult.data.url;
						toast.success('로고가 업로드되었습니다.');
					} else {
						throw new Error('로고 업로드에 실패했습니다.');
					}
				} catch (uploadError) {
					console.error('Logo upload failed:', uploadError);
					toast.error('로고 업로드에 실패했습니다. 다시 시도해주세요.');
					isCreating = false;
					return;
				}
			}

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
				policyUri: policyUriValue || undefined,
				recaptchaToken: recaptchaToken
			})) as { clientSecret: string; policyUri?: string };

			createdClientSecret = response.clientSecret;
			showSecretModal = true;

			toast.success('클라이언트가 성공적으로 생성되었습니다.');

			showCreateForm = false;
			resetForm();
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to create client:', error);
			toast.error('클라이언트 생성에 실패했습니다.');
		} finally {
			isCreating = false;
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
		editScopes = client.scopes ? client.scopes.join(' ') : 'openid profile';
		editSelectedScopes = client.scopes || ['openid', 'profile'];

		// 로고 URI가 유효한 경우만 설정, 그렇지 않으면 빈 문자열
		const originalLogoUri = client.logoUri;
		editLogoUri =
			originalLogoUri &&
			originalLogoUri.trim() &&
			originalLogoUri !== 'null' &&
			originalLogoUri !== 'undefined'
				? originalLogoUri
				: '';

		editTermsOfServiceUri = client.termsOfServiceUri || '';
		editPolicyUri = client.policyUri || '';

		// 에러 상태 초기화 (매우 중요!)
		editClientNameError = '';
		editRedirectUrisError = '';
		editScopesError = '';
		editLogoUriError = '';
		editTermsOfServiceUriError = '';
		editPolicyUriError = '';

		// 로고 업로드 상태 초기화
		selectedLogoFile = null;
		if (logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}

		// 로고 삭제 상태 초기화
		logoMarkedForDeletion = false;

		showEditModal = true;
	}

	function removeClientLogo() {
		if (!clientToEdit) return;

		// 낙관적 업데이트: UI에서만 로고 제거 표시
		logoMarkedForDeletion = true;

		// 새 로고 파일이 선택되어 있다면 제거
		selectedLogoFile = null;
		if (logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}

		toast.info('로고가 삭제 예약되었습니다. 저장을 눌러 변경사항을 적용하세요.');
	}

	function restoreClientLogo() {
		// 로고 삭제를 취소
		logoMarkedForDeletion = false;
		toast.info('로고 삭제가 취소되었습니다.');
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

		// 에러가 있는 필드들 수집
		const errors = [];
		if (editClientNameError) errors.push(`클라이언트 이름: ${editClientNameError}`);
		if (editRedirectUrisError) errors.push(`리다이렉트 URI: ${editRedirectUrisError}`);
		if (editScopesError) errors.push(`권한 범위: ${editScopesError}`);
		if (editLogoUriError) errors.push(`로고 URL: ${editLogoUriError}`);
		if (editTermsOfServiceUriError) errors.push(`서비스 약관 URL: ${editTermsOfServiceUriError}`);
		if (editPolicyUriError) errors.push(`개인정보처리방침 URL: ${editPolicyUriError}`);

		// 검증 실패 시 구체적인 피드백 제공
		if (errors.length > 0) {
			const errorMessage = `다음 필드를 확인해주세요:\n${errors.join('\n')}`;
			toast.error(errorMessage);
			return;
		}

		isUpdating = true;

		try {
			let finalLogoUri = editLogoUri;

			// 로고 삭제가 예약된 경우 빈 문자열로 설정 (updateClient에서 처리)
			if (logoMarkedForDeletion && clientToEdit.logoUri) {
				finalLogoUri = '';
				logoMarkedForDeletion = false;
			}

			// 로고 파일이 선택된 경우 업로드
			if (selectedLogoFile) {
				try {
					const uploadResult = await apiClient.uploadLogo(selectedLogoFile);
					if (uploadResult.success) {
						finalLogoUri = uploadResult.data.url;
						logoMarkedForDeletion = false; // 새 로고 업로드 시 삭제 상태 해제
						toast.success('로고가 업로드되었습니다.');
					} else {
						throw new Error('로고 업로드에 실패했습니다.');
					}
				} catch (uploadError) {
					console.error('Logo upload failed:', uploadError);
					toast.error('로고 업로드에 실패했습니다. 다시 시도해주세요.');
					isUpdating = false;
					return;
				}
			}

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
				logoUri: finalLogoUri || '',
				termsOfServiceUri: editTermsOfServiceUri || undefined,
				policyUri: editPolicyUri || undefined
			});

			toast.success('클라이언트가 성공적으로 수정되었습니다.');
			showEditModal = false;
			clientToEdit = null;
			logoMarkedForDeletion = false; // 상태 초기화
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to update client:', error);
			toast.error('클라이언트 수정에 실패했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	async function toggleClientStatus(client: Client) {
		clientToChangeStatus = client;
		showStatusModal = true;
	}

	async function confirmToggleClientStatus() {
		if (!clientToChangeStatus) return;

		try {
			isChangingStatus = true;
			await apiClient.updateClientStatus(clientToChangeStatus.id, !clientToChangeStatus.isActive);
			toast.success(
				`클라이언트가 ${!clientToChangeStatus.isActive ? '활성화' : '비활성화'} 되었습니다.`
			);
			showStatusModal = false;
			clientToChangeStatus = null;
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to update client status:', error);
			toast.error('클라이언트 상태 변경에 실패했습니다.');
		} finally {
			isChangingStatus = false;
		}
	}

	function closeStatusModal() {
		showStatusModal = false;
		clientToChangeStatus = null;
	}

	async function confirmDeleteClient() {
		if (!clientToDelete) return;

		try {
			isDeleting = true;
			await apiClient.deleteClient(clientToDelete.id);
			toast.success('클라이언트가 성공적으로 삭제되었습니다.');
			showDeleteModal = false;
			clientToDelete = null;
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to delete client:', error);
			toast.error('클라이언트 삭제에 실패했습니다.');
		} finally {
			isDeleting = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('클립보드에 복사되었습니다.');
	}

	function resetClientSecret(client: Client) {
		clientToResetSecret = client;
		showSecretResetModal = true;
		newResetSecret = '';
	}

	async function confirmResetClientSecret() {
		if (!clientToResetSecret) return;

		try {
			isResettingSecret = true;
			const response = (await apiClient.resetClientSecret(clientToResetSecret.id)) as {
				clientSecret: string;
			};
			newResetSecret = response.clientSecret;
			toast.success('클라이언트 시크릿이 성공적으로 재설정되었습니다.');
		} catch (error) {
			console.error('Failed to reset client secret:', error);
			toast.error('클라이언트 시크릿 재설정에 실패했습니다.');
		} finally {
			isResettingSecret = false;
		}
	}

	function closeSecretResetModal() {
		showSecretResetModal = false;
		clientToResetSecret = null;
		newResetSecret = '';
	}

	// 스코프 토글 함수들
	function handleScopeToggle(scope: string) {
		if (selectedScopes.includes(scope)) {
			selectedScopes = selectedScopes.filter((s) => s !== scope);
		} else {
			selectedScopes = [...selectedScopes, scope];
		}
		// scopesValue도 동기화
		scopesValue = selectedScopes.join(' ');
	}

	function handleEditScopeToggle(scope: string) {
		if (editSelectedScopes.includes(scope)) {
			editSelectedScopes = editSelectedScopes.filter((s) => s !== scope);
		} else {
			editSelectedScopes = [...editSelectedScopes, scope];
		}
		// editScopes도 동기화
		editScopes = editSelectedScopes.join(' ');
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
				<Button onclick={toggleCreateForm} class="min-w-0 flex-1 sm:flex-none">
					{#if showCreateForm}
						<FontAwesomeIcon icon={faMinus} class="mr-2" />
					{:else}
						<FontAwesomeIcon icon={faPlus} class="mr-2" />
					{/if}
					<span class="truncate">{showCreateForm ? '취소' : '클라이언트 추가'}</span>
				</Button>
			</div>
		</div>
	{/snippet}

	{#if isLoading}
		<DashboardSkeleton type="stats" count={3} />
	{:else}
		<ClientStats {clients} />
	{/if}

	<Alert
		variant="info"
		title="SDK를 활용한 통합 안내"
		message="FlowAuth와의 통합을 위해 OAuth2/OIDC 클라이언트 SDK를 활용해보세요. 아래 링크에서 자세한 사용법을 확인할 수 있습니다."
		icon={faCode}
		links={[
			{
				text: 'GitHub 저장소',
				url: 'https://github.com/vientofactory/FlowAuth-SDK',
				icon: faGithub
			},
			{
				text: '공식 문서',
				url: 'https://op0.gitbook.io/flowauth/oauth2-oidc-sdk',
				icon: faBook
			}
		]}
	/>

	<ClientCreateForm
		{showCreateForm}
		{isCreating}
		bind:clientNameValue
		bind:clientDescriptionValue
		bind:redirectUrisValue
		bind:scopesValue
		bind:selectedScopes
		bind:logoUriValue
		bind:termsOfServiceUriValue
		bind:policyUriValue
		{clientNameError}
		{redirectUrisError}
		{scopesError}
		{logoUriError}
		{termsOfServiceUriError}
		{policyUriError}
		bind:selectedLogoFile
		bind:logoPreviewUrl
		cacheBuster={logoCacheBuster}
		bind:recaptchaToken
		onToggleCreateForm={toggleCreateForm}
		onCreateClient={createClient}
		onScopeToggle={handleScopeToggle}
	/>

	<ClientList
		{clients}
		{isLoading}
		{showCreateForm}
		onToggleCreateForm={toggleCreateForm}
		onEditClient={editClient}
		onToggleClientStatus={toggleClientStatus}
		onDeleteClient={deleteClient}
		onResetClientSecret={resetClientSecret}
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
	{isDeleting}
	onClose={() => {
		showDeleteModal = false;
		clientToDelete = null;
	}}
	onConfirmDelete={confirmDeleteClient}
/>

<ClientSecretResetModal
	show={showSecretResetModal}
	clientName={clientToResetSecret?.name || ''}
	isLoading={isResettingSecret}
	newSecret={newResetSecret}
	onConfirm={confirmResetClientSecret}
	onClose={closeSecretResetModal}
	onCopyToClipboard={copyToClipboard}
/>

<ClientStatusModal
	show={showStatusModal}
	client={clientToChangeStatus}
	isLoading={isChangingStatus}
	onConfirm={confirmToggleClientStatus}
	onClose={closeStatusModal}
/>

<ClientEditModal
	{showEditModal}
	{clientToEdit}
	bind:editClientName
	bind:editClientDescription
	bind:editRedirectUris
	bind:editScopes
	bind:selectedScopes={editSelectedScopes}
	bind:editLogoUri
	bind:editTermsOfServiceUri
	bind:editPolicyUri
	{editClientNameError}
	{editRedirectUrisError}
	{editScopesError}
	{editLogoUriError}
	{editTermsOfServiceUriError}
	{editPolicyUriError}
	bind:selectedLogoFile
	bind:logoPreviewUrl
	{isUpdating}
	{logoCacheBuster}
	onClose={() => {
		showEditModal = false;
		clientToEdit = null;
		logoMarkedForDeletion = false; // 모달 닫을 때 상태 초기화
	}}
	onUpdateClient={updateClient}
	onRemoveClientLogo={removeClientLogo}
	onRestoreClientLogo={restoreClientLogo}
	{logoMarkedForDeletion}
	onScopeToggle={handleEditScopeToggle}
/>
