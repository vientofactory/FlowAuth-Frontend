<script lang="ts">
	import { DashboardLayout, Button, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Client } from '$lib/types/oauth.types';
	import type { User } from '$lib/types/user.types';
	import { USER_TYPES } from '$lib/types/user.types';
	import { authState } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import {
		validateClientName,
		validateRedirectUri,
		validateUrl,
		validateLogoUrl,
		validateScopes
	} from '$lib/utils/validation.utils';
	import ClientStats from '$lib/components/clients/ClientStats.svelte';
	import ClientCreateForm from '$lib/components/clients/ClientCreateForm.svelte';
	import ClientList from '$lib/components/clients/ClientList.svelte';
	import ClientSecretModal from '$lib/components/clients/ClientSecretModal.svelte';
	import ClientSecretResetModal from '$lib/components/clients/ClientSecretResetModal.svelte';
	import ClientDeleteModal from '$lib/components/clients/ClientDeleteModal.svelte';
	import ClientEditModal from '$lib/components/clients/ClientEditModal.svelte';
	import ClientStatusModal from '$lib/components/clients/ClientStatusModal.svelte';

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
	let policyUriValue = $state('');

	// 로고 업로드 관련
	let selectedLogoFile = $state<File | null>(null);
	let logoPreviewUrl = $state<string | null>(null);
	let logoCacheBuster = $state('');

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
		// 빈 값은 허용 (선택적 필드)
		if (!logoUriValue || logoUriValue.trim() === '') {
			logoUriError = '';
			return;
		}

		const result = validateLogoUrl(logoUriValue);
		logoUriError = result.isValid ? '' : result.message || '';
	}

	function validateTermsOfServiceUriField() {
		// 빈 값은 허용 (선택적 필드)
		if (!termsOfServiceUriValue || termsOfServiceUriValue.trim() === '') {
			termsOfServiceUriError = '';
			return;
		}

		const result = validateUrl(termsOfServiceUriValue, '서비스 약관 URL');
		termsOfServiceUriError = result.isValid ? '' : result.message || '';
	}

	function validatePolicyUriField() {
		// 빈 값은 허용 (선택적 필드)
		if (!policyUriValue || policyUriValue.trim() === '') {
			policyUriError = '';
			return;
		}

		const result = validateUrl(policyUriValue, '개인정보처리방침 URL');
		policyUriError = result.isValid ? '' : result.message || '';
	}

	// 검증 함수들 (수정 폼)
	function validateEditClientNameField() {
		console.log('validateEditClientNameField - editClientName:', editClientName);
		const result = validateClientName(editClientName);
		editClientNameError = result.isValid ? '' : result.message || '';
		console.log('validateEditClientNameField - result:', result, 'error:', editClientNameError);
	}

	function validateEditRedirectUrisField() {
		console.log('validateEditRedirectUrisField - editRedirectUris:', editRedirectUris);
		if (!editRedirectUris.trim()) {
			editRedirectUrisError = '리다이렉트 URI를 입력해주세요.';
			console.log('validateEditRedirectUrisField - empty error:', editRedirectUrisError);
			return;
		}

		const uris = editRedirectUris
			.split('\n')
			.map((uri) => uri.trim())
			.filter((uri) => uri.length > 0);

		console.log('validateEditRedirectUrisField - parsed uris:', uris);

		if (uris.length === 0) {
			editRedirectUrisError = '최소 하나의 리다이렉트 URI를 입력해주세요.';
			console.log('validateEditRedirectUrisField - no uris error:', editRedirectUrisError);
			return;
		}

		for (const uri of uris) {
			const result = validateRedirectUri(uri);
			if (!result.isValid) {
				editRedirectUrisError = result.message || '올바르지 않은 리다이렉트 URI가 있습니다.';
				console.log(
					'validateEditRedirectUrisField - invalid uri:',
					uri,
					'error:',
					editRedirectUrisError
				);
				return;
			}
		}

		editRedirectUrisError = '';
		console.log('validateEditRedirectUrisField - success');
	}

	function validateEditScopesField() {
		console.log('validateEditScopesField - editScopes:', editScopes);
		if (!editScopes.trim()) {
			editScopesError = '권한 범위를 입력해주세요.';
			console.log('validateEditScopesField - empty error:', editScopesError);
			return;
		}

		const scopes = editScopes
			.split(' ')
			.map((scope) => scope.trim())
			.filter((scope) => scope.length > 0);

		console.log('validateEditScopesField - parsed scopes:', scopes);
		const result = validateScopes(scopes);
		editScopesError = result.isValid ? '' : result.message || '';
		console.log('validateEditScopesField - result:', result, 'error:', editScopesError);
	}

	function validateEditLogoUriField() {
		console.log('validateEditLogoUriField - editLogoUri:', editLogoUri);
		// 빈 값은 허용 (선택적 필드)
		if (!editLogoUri || editLogoUri.trim() === '') {
			editLogoUriError = '';
			console.log('validateEditLogoUriField - empty value allowed');
			return;
		}

		const result = validateLogoUrl(editLogoUri);
		editLogoUriError = result.isValid ? '' : result.message || '';
		console.log('validateEditLogoUriField - result:', result, 'error:', editLogoUriError);
	}

	function validateEditTermsOfServiceUriField() {
		console.log(
			'validateEditTermsOfServiceUriField - editTermsOfServiceUri:',
			editTermsOfServiceUri
		);
		// 빈 값은 허용 (선택적 필드)
		if (!editTermsOfServiceUri || editTermsOfServiceUri.trim() === '') {
			editTermsOfServiceUriError = '';
			console.log('validateEditTermsOfServiceUriField - empty value allowed');
			return;
		}

		const result = validateUrl(editTermsOfServiceUri, '서비스 약관 URL');
		editTermsOfServiceUriError = result.isValid ? '' : result.message || '';
		console.log(
			'validateEditTermsOfServiceUriField - result:',
			result,
			'error:',
			editTermsOfServiceUriError
		);
	}

	function validateEditPolicyUriField() {
		console.log('validateEditPolicyUriField - editPolicyUri:', editPolicyUri);
		// 빈 값은 허용 (선택적 필드)
		if (!editPolicyUri || editPolicyUri.trim() === '') {
			editPolicyUriError = '';
			console.log('validateEditPolicyUriField - empty value allowed');
			return;
		}

		const result = validateUrl(editPolicyUri, '개인정보처리방침 URL');
		editPolicyUriError = result.isValid ? '' : result.message || '';
		console.log('validateEditPolicyUriField - result:', result, 'error:', editPolicyUriError);
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

			// 디버깅: 클라이언트 로고 정보 확인
			clients.forEach((client) => {
				console.log(`Client ${client.name}: logoUri =`, client.logoUri);
			});
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
		console.log('Editing client:', client);
		console.log('Client logoUri:', client.logoUri);

		clientToEdit = client;
		editClientName = client.name;
		editClientDescription = client.description || '';
		editRedirectUris = client.redirectUris.join('\n');
		editScopes = client.scopes ? client.scopes.join(' ') : 'read write';

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

		console.log(`편집할 클라이언트 [${client.name}] - 원본 logoUri:`, originalLogoUri);
		console.log(`편집할 클라이언트 [${client.name}] - 처리된 editLogoUri:`, editLogoUri);

		// 로고 업로드 상태 초기화
		selectedLogoFile = null;
		if (logoPreviewUrl) {
			URL.revokeObjectURL(logoPreviewUrl);
			logoPreviewUrl = null;
		}

		showEditModal = true;
	}

	async function removeClientLogo() {
		if (!clientToEdit) return;

		// 원본 로고 URI를 함수 시작 시 저장
		const originalLogoUri = editLogoUri;

		try {
			isUpdating = true;

			// UI를 즉시 업데이트하기 위해 먼저 로고 URI를 제거
			editLogoUri = '';

			// 캐시 버스터 업데이트로 이미지 캐시 무효화
			logoCacheBuster = Date.now().toString();

			const updatedClient = (await apiClient.removeClientLogo(clientToEdit.id)) as Client;

			// 클라이언트 정보 업데이트
			clientToEdit = updatedClient;
			editLogoUri = updatedClient.logoUri || '';

			// 로고 업로드 상태 초기화
			selectedLogoFile = null;
			if (logoPreviewUrl) {
				URL.revokeObjectURL(logoPreviewUrl);
				logoPreviewUrl = null;
			}

			// 클라이언트 목록에서도 해당 클라이언트 업데이트
			const clientIndex = clients.findIndex((c) => c.id === updatedClient.id);
			if (clientIndex >= 0) {
				clients[clientIndex] = updatedClient;
			}

			toast.success('로고가 성공적으로 제거되었습니다.');
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to remove client logo:', error);

			// 에러 발생 시 원래 로고 URI로 복원
			if (originalLogoUri) {
				editLogoUri = originalLogoUri;
			}

			toast.error('로고 제거에 실패했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	async function updateClient() {
		if (!clientToEdit) return;

		console.log('=== 클라이언트 수정 검증 시작 ===');
		console.log('editClientName:', editClientName);
		console.log('editRedirectUris:', editRedirectUris);
		console.log('editScopes:', editScopes);
		console.log('editLogoUri:', editLogoUri);
		console.log('editTermsOfServiceUri:', editTermsOfServiceUri);
		console.log('editPolicyUri:', editPolicyUri);

		// 모든 필드 검증 수행
		validateEditClientNameField();
		validateEditRedirectUrisField();
		validateEditScopesField();
		validateEditLogoUriField();
		validateEditTermsOfServiceUriField();
		validateEditPolicyUriField();

		console.log('=== 검증 결과 ===');
		console.log('editClientNameError:', editClientNameError);
		console.log('editRedirectUrisError:', editRedirectUrisError);
		console.log('editScopesError:', editScopesError);
		console.log('editLogoUriError:', editLogoUriError);
		console.log('editTermsOfServiceUriError:', editTermsOfServiceUriError);
		console.log('editPolicyUriError:', editPolicyUriError);

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
			console.log('검증 실패:', errors);
			const errorMessage = `다음 필드를 확인해주세요:\n${errors.join('\n')}`;
			toast.error(errorMessage);
			return;
		}

		console.log('=== 모든 검증 통과, 클라이언트 업데이트 진행 ===');
		isUpdating = true;

		try {
			// 로고 파일이 선택된 경우 먼저 업로드
			if (selectedLogoFile) {
				try {
					const uploadResult = await apiClient.uploadLogo(selectedLogoFile);
					if (uploadResult.success) {
						editLogoUri = uploadResult.data.url;
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
				logoUri: editLogoUri || '',
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
		bind:selectedLogoFile
		bind:logoPreviewUrl
		cacheBuster={logoCacheBuster}
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
	}}
	onUpdateClient={updateClient}
	onRemoveClientLogo={removeClientLogo}
/>
