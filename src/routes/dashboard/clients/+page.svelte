<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, Input, Loading, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Client } from '$lib/types/oauth.types';

	let clients = $state<Client[]>([]);
	let isLoading = $state(true);

	let showCreateForm = $state(false);
	let isCreating = $state(false);
	let newClient = $state({
		name: '',
		description: '',
		redirectUris: '',
		grants: ['authorization_code'],
		scopes: 'read write'
	});

	// 디버깅을 위한 reactive 값들
	let clientNameValue = $state('');
	let clientDescriptionValue = $state('');
	let redirectUrisValue = $state('');
	let scopesValue = $state('read write');

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

	// 초기화 보장
	onMount(() => {
		clientNameValue = '';
		clientDescriptionValue = '';
		redirectUrisValue = '';
		scopesValue = 'read write';
	});

	const toast = useToast();

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
		newClient = {
			name: '',
			description: '',
			redirectUris: '',
			grants: ['authorization_code'],
			scopes: 'read write'
		};
	}

	async function createClient() {
		if (!clientNameValue || clientNameValue.trim().length === 0) {
			toast.error('클라이언트 이름을 입력해주세요.');
			return;
		}

		if (!redirectUrisValue || !redirectUrisValue.trim()) {
			toast.error('리다이렉트 URI를 입력해주세요.');
			return;
		}

		if (!scopesValue || scopesValue.trim().length === 0) {
			toast.error('권한 범위를 입력해주세요.');
			return;
		}

		try {
			const redirectUris = redirectUrisValue
				.split('\n')
				.map((uri) => uri.trim())
				.filter((uri) => uri.length > 0);

			const scopes = scopesValue
				.split(' ')
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0);

			await apiClient.createClient({
				name: clientNameValue,
				description: clientDescriptionValue || undefined,
				redirectUris,
				grants: newClient.grants,
				scopes
			});

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
		if (!confirm('정말로 이 클라이언트를 삭제하시겠습니까?')) {
			return;
		}

		try {
			await apiClient.deleteClient(clientId);
			toast.success('클라이언트가 삭제되었습니다.');
			await loadClients(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to delete client:', error);
			toast.error('클라이언트 삭제에 실패했습니다.');
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
				<Button onclick={toggleCreateForm} class="flex-1 sm:flex-none">
					<i class="fas fa-plus mr-2"></i>
					{showCreateForm ? '취소' : '새 클라이언트'}
				</Button>
			</div>
			<!-- 데스크톱에서는 모든 액션 표시 -->
			<div class="hidden lg:flex gap-2">
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
				<Button onclick={toggleCreateForm}>
					<i class="fas fa-plus mr-2"></i>
					{showCreateForm ? '취소' : '새 클라이언트 생성'}
				</Button>
			</div>
		</div>
	{/snippet}

	<!-- 통계 카드 -->
	<div class="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-100">
						<i class="fas fa-users text-lg sm:text-xl text-blue-600"></i>
					</div>
				</div>
				<div class="ml-2 sm:ml-3 flex-1">
					<p class="text-xs sm:text-sm font-medium text-gray-500">총 클라이언트</p>
					<p class="text-lg sm:text-xl font-bold text-gray-900">{clients.length}</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-100">
						<i class="fas fa-check-circle text-lg sm:text-xl text-green-600"></i>
					</div>
				</div>
				<div class="ml-2 sm:ml-3 flex-1">
					<p class="text-xs sm:text-sm font-medium text-gray-500">활성 클라이언트</p>
					<p class="text-lg sm:text-xl font-bold text-gray-900">
						{clients.filter((c) => c.isActive).length}
					</p>
				</div>
			</div>
		</Card>
	</div>

		<!-- 새 클라이언트 생성 폼 -->
	{#if showCreateForm}
		<Card class="mb-4 sm:mb-6">
			<div class="p-4 sm:p-6">
				<h3 class="text-base sm:text-lg font-semibold text-gray-900 mb-4">
					새 클라이언트 생성
				</h3>
				<form onsubmit={(e) => { e.preventDefault(); createClient(); }} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="clientName" class="block text-sm font-medium text-gray-700 mb-1">
								클라이언트 이름 *
							</label>
							<input
								id="clientName"
								bind:value={clientNameValue}
								placeholder="클라이언트 애플리케이션 이름"
								required
								class="w-full h-10 sm:h-11 text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="clientDescription" class="block text-sm font-medium text-gray-700 mb-1">
								설명
							</label>
							<input
								id="clientDescription"
								bind:value={clientDescriptionValue}
								placeholder="클라이언트 애플리케이션 설명"
								class="w-full h-10 sm:h-11 text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3"
							/>
						</div>

						<div class="sm:col-span-2">
							<label for="redirectUris" class="block text-sm font-medium text-gray-700 mb-1">
								리다이렉트 URI *
							</label>
							<textarea
								id="redirectUris"
								bind:value={redirectUrisValue}
								placeholder="https://example.com/callback"
								rows="3"
								required
								class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-20 sm:h-24 text-base px-3 py-2"
							></textarea>
							<p class="mt-1 text-xs text-gray-500">한 줄에 하나씩 입력해주세요.</p>
						</div>

						<div>
							<label for="scopes" class="block text-sm font-medium text-gray-700 mb-1">
								권한 범위
							</label>
							<input
								id="scopes"
								bind:value={scopesValue}
								placeholder="read write"
								class="w-full h-10 sm:h-11 text-base rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3"
							/>
							<p class="mt-1 text-xs text-gray-500">공백으로 구분하여 입력해주세요.</p>
						</div>
					</div>

					<div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
						<Button
							type="button"
							variant="outline"
							onclick={toggleCreateForm}
							class="w-full sm:w-auto h-10 sm:h-11"
						>
							취소
						</Button>
						<Button
							type="submit"
							disabled={isCreating}
							class="w-full sm:w-auto h-10 sm:h-11"
						>
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

	<!-- 클라이언트 목록 -->
	<Card>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-base sm:text-lg font-medium text-gray-900">클라이언트 목록</h3>
		</div>

		{#if isLoading}
			<div class="py-8 text-center">
				<i class="fas fa-spinner fa-spin mb-4 text-2xl text-gray-400"></i>
				<p class="text-gray-500">클라이언트 목록을 불러오는 중...</p>
			</div>
		{:else if clients.length === 0}
			<div class="py-8 text-center">
				<i class="fas fa-inbox mb-4 text-4xl text-gray-400"></i>
				<p class="mb-4 text-gray-500">등록된 클라이언트가 없습니다.</p>
				<Button onclick={toggleCreateForm} class="h-10 sm:h-11">
					<i class="fas fa-plus mr-2"></i>
					첫 번째 클라이언트 생성
				</Button>
			</div>
		{:else}
			<div class="space-y-3 sm:space-y-4">
				{#each clients as client (client.id)}
					<div class="rounded-lg border border-gray-200 p-3 sm:p-4 transition-shadow hover:shadow-md">
						<div class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
							<div class="flex-1">
								<div class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
									<h4 class="text-base sm:text-lg font-medium text-gray-900">{client.name}</h4>
									<Badge variant={client.isActive ? 'success' : 'secondary'} size="sm" class="self-start">
										{client.isActive ? '활성' : '비활성'}
									</Badge>
								</div>

								{#if client.description}
									<p class="mt-1 text-sm text-gray-600">{client.description}</p>
								{/if}

								<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									<div>
										<p class="text-xs font-medium text-gray-500">Client ID</p>
										<div class="flex items-center space-x-2 mt-1">
											<code class="rounded bg-gray-100 px-2 py-1 text-xs sm:text-sm flex-1 truncate">
												{client.clientId}
											</code>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => copyToClipboard(client.clientId)}
												class="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
												aria-label="Copy Client ID"
											>
												<i class="fas fa-copy text-xs"></i>
											</Button>
										</div>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">리다이렉트 URI</p>
										<div class="mt-1">
											{#each client.redirectUris as uri (uri)}
												<p class="truncate text-xs sm:text-sm text-gray-900">{uri}</p>
											{/each}
										</div>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">생성일</p>
										<p class="text-xs sm:text-sm text-gray-900 mt-1">
											{new Date(client.createdAt).toLocaleDateString('ko-KR')}
										</p>
									</div>
								</div>
							</div>

							<!-- 모바일 액션 버튼들 -->
							<div class="flex space-x-2 sm:ml-4 sm:flex-col sm:space-x-0 sm:space-y-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => toggleClientStatus(client)}
									class="flex-1 sm:flex-none h-9 sm:h-8 px-3 text-sm"
									title={client.isActive ? '비활성화' : '활성화'}
								>
									<i class="fas {client.isActive ? 'fa-pause' : 'fa-play'} mr-1 sm:mr-0"></i>
									<span class="sm:hidden">{client.isActive ? '비활성화' : '활성화'}</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => deleteClient(client.id)}
									class="flex-1 sm:flex-none h-9 sm:h-8 px-3 text-sm text-red-600 hover:text-red-700"
									title="삭제"
								>
									<i class="fas fa-trash mr-1 sm:mr-0"></i>
									<span class="sm:hidden">삭제</span>
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</DashboardLayout>
