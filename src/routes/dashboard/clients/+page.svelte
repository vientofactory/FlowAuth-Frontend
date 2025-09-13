<script lang="ts">
	import { Card, Button, Input, Badge, Loading, Modal, Table, Dropdown } from '$lib';
	import { authStore, authState, useToast } from '$lib';
	import { onMount, onDestroy } from 'svelte';
	import type { User } from '$lib';

	let isLoading = $state(true);
	let user = $state<User | null>(null);
	let isAuthenticated = $state(false);
	let unsubscribe: (() => void) | null = null;

	// 클라이언트 관리 상태
	let clients = $state<OAuthClient[]>([]);
	let isLoadingClients = $state(false);

	// 새 클라이언트 생성 모달
	let showCreateModal = $state(false);
	let createForm = $state({
		name: '',
		description: '',
		redirectUris: '',
		scopes: 'read'
	});
	let isCreating = $state(false);

	// 클라이언트 편집 모달
	let showEditModal = $state(false);
	let editingClient = $state<OAuthClient | null>(null);
	let editForm = $state({
		name: '',
		description: '',
		redirectUris: '',
		scopes: 'read'
	});
	let isUpdating = $state(false);

	// 클라이언트 비밀키 표시 모달
	let showSecretModal = $state(false);
	let clientSecret = $state('');

	const toast = useToast();

	// OAuth 클라이언트 타입 정의
	interface OAuthClient {
		id: string;
		name: string;
		description: string;
		clientId: string;
		clientSecret?: string;
		redirectUris: string[];
		scopes: string[];
		createdAt: Date;
		lastUsed?: Date;
		isActive: boolean;
	}

	// 테이블 데이터 타입 정의
	interface TableDataRow {
		id: string;
		name: string;
		clientId: string;
		scopes: string[];
		status: boolean;
		lastUsed: Date | undefined;
		_original: OAuthClient;
	}

	// 테이블 컬럼 정의
	const columns: Array<{
		key: keyof TableDataRow;
		label: string;
		sortable: boolean;
	}> = [
		{
			key: 'name',
			label: '클라이언트 이름',
			sortable: true
		},
		{
			key: 'clientId',
			label: 'Client ID',
			sortable: true
		},
		{
			key: 'scopes',
			label: '권한',
			sortable: false
		},
		{
			key: 'status',
			label: '상태',
			sortable: true
		},
		{
			key: 'lastUsed',
			label: '마지막 사용',
			sortable: true
		}
	];

	onMount(async () => {
		await authStore.initialize();

		unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isLoading = state.isLoading;
			isAuthenticated = state.isAuthenticated;
		});

		await loadClients();
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 인증 상태에 따른 리다이렉트 처리
	$effect(() => {
		if (!isLoading && !isAuthenticated) {
			window.location.href = '/auth/login';
		}
	});

	async function loadClients() {
		isLoadingClients = true;
		try {
			// TODO: API 호출로 실제 클라이언트 목록 가져오기
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 임시 더미 데이터
			clients = [
				{
					id: '1',
					name: '웹 애플리케이션',
					description: '메인 웹 서비스용 OAuth2 클라이언트',
					clientId: 'web-app-client-id',
					redirectUris: ['https://example.com/callback'],
					scopes: ['read', 'write'],
					createdAt: new Date('2024-01-15'),
					lastUsed: new Date('2024-01-20'),
					isActive: true
				},
				{
					id: '2',
					name: '모바일 앱',
					description: 'iOS/Android 앱용 OAuth2 클라이언트',
					clientId: 'mobile-app-client-id',
					redirectUris: ['com.example.app://callback'],
					scopes: ['read'],
					createdAt: new Date('2024-01-10'),
					lastUsed: new Date('2024-01-18'),
					isActive: true
				},
				{
					id: '3',
					name: '개발용 클라이언트',
					description: '개발 및 테스트용 클라이언트',
					clientId: 'dev-client-id',
					redirectUris: ['http://localhost:3000/callback'],
					scopes: ['read', 'write', 'admin'],
					createdAt: new Date('2024-01-12'),
					lastUsed: undefined,
					isActive: false
				}
			];
		} catch (error) {
			console.error('Failed to load clients:', error);
			toast.error('클라이언트 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoadingClients = false;
		}
	}

	function openCreateModal() {
		createForm = {
			name: '',
			description: '',
			redirectUris: '',
			scopes: 'read'
		};
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
		createForm = {
			name: '',
			description: '',
			redirectUris: '',
			scopes: 'read'
		};
	}

	async function createClient() {
		if (!createForm.name.trim() || !createForm.redirectUris.trim()) {
			toast.error('클라이언트 이름과 리다이렉트 URI는 필수입니다.');
			return;
		}

		isCreating = true;
		try {
			// TODO: API 호출로 클라이언트 생성
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 새 클라이언트 생성
			const newClient: OAuthClient = {
				id: Date.now().toString(),
				name: createForm.name,
				description: createForm.description,
				clientId: `client-${Date.now()}`,
				redirectUris: createForm.redirectUris.split(',').map(uri => uri.trim()),
				scopes: createForm.scopes.split(',').map(scope => scope.trim()),
				createdAt: new Date(),
				isActive: true
			};

			clients = [...clients, newClient];
			
			// 클라이언트 비밀키 표시
			clientSecret = `secret-${Date.now()}`;
			showSecretModal = true;
			closeCreateModal();

			toast.success('클라이언트가 성공적으로 생성되었습니다.');
		} catch (error) {
			console.error('Failed to create client:', error);
			toast.error('클라이언트 생성에 실패했습니다.');
		} finally {
			isCreating = false;
		}
	}

	function openEditModal(client: OAuthClient) {
		editingClient = client;
		editForm = {
			name: client.name,
			description: client.description,
			redirectUris: client.redirectUris.join(', '),
			scopes: client.scopes.join(', ')
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingClient = null;
		editForm = {
			name: '',
			description: '',
			redirectUris: '',
			scopes: ''
		};
	}

	async function updateClient() {
		if (!editingClient || !editForm.name.trim() || !editForm.redirectUris.trim()) {
			toast.error('클라이언트 이름과 리다이렉트 URI는 필수입니다.');
			return;
		}

		isUpdating = true;
		try {
			// TODO: API 호출로 클라이언트 업데이트
			await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 딜레이

			// 클라이언트 업데이트
			clients = clients.map(client => 
				client.id === editingClient!.id 
					? {
						...client,
						name: editForm.name,
						description: editForm.description,
						redirectUris: editForm.redirectUris.split(',').map(uri => uri.trim()),
						scopes: editForm.scopes.split(',').map(scope => scope.trim())
					}
					: client
			);

			closeEditModal();
			toast.success('클라이언트가 성공적으로 업데이트되었습니다.');
		} catch (error) {
			console.error('Failed to update client:', error);
			toast.error('클라이언트 업데이트에 실패했습니다.');
		} finally {
			isUpdating = false;
		}
	}

	async function toggleClientStatus(client: OAuthClient) {
		try {
			// TODO: API 호출로 클라이언트 상태 변경
			await new Promise(resolve => setTimeout(resolve, 500)); // 임시 딜레이

			clients = clients.map(c => 
				c.id === client.id 
					? { ...c, isActive: !c.isActive }
					: c
			);

			toast.success(`클라이언트가 ${client.isActive ? '비활성화' : '활성화'}되었습니다.`);
		} catch (error) {
			console.error('Failed to toggle client status:', error);
			toast.error('클라이언트 상태 변경에 실패했습니다.');
		}
	}

	async function deleteClient(client: OAuthClient) {
		if (!confirm(`"${client.name}" 클라이언트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
			return;
		}

		try {
			// TODO: API 호출로 클라이언트 삭제
			await new Promise(resolve => setTimeout(resolve, 500)); // 임시 딜레이

			clients = clients.filter(c => c.id !== client.id);
			toast.success('클라이언트가 삭제되었습니다.');
		} catch (error) {
			console.error('Failed to delete client:', error);
			toast.error('클라이언트 삭제에 실패했습니다.');
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			toast.success('클립보드에 복사되었습니다.');
		}).catch(() => {
			toast.error('복사에 실패했습니다.');
		});
	}

	function navigateBack() {
		window.location.href = '/dashboard';
	}

	function handleLogout() {
		toast.info('로그아웃 중입니다...');
		authStore.logout();
		setTimeout(() => {
			window.location.href = '/auth/login';
		}, 1000);
	}

	// 테이블 데이터 가공
	const tableData = $derived<TableDataRow[]>(clients.map(client => ({
		id: client.id,
		name: client.name,
		clientId: client.clientId,
		scopes: client.scopes,
		status: client.isActive,
		lastUsed: client.lastUsed,
		_original: client
	})));
</script>

<svelte:head>
	<title>클라이언트 관리 - FlowAuth</title>
</svelte:head>

{#if isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<Loading variant="spinner" size="lg" text="클라이언트 정보를 불러오는 중..." />
	</div>
{:else if user}
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-4">
						<Button
							variant="outline"
							size="sm"
							onclick={navigateBack}
							class="text-gray-600 hover:text-gray-900"
						>
							<i class="fas fa-arrow-left mr-2"></i>
							대시보드로
						</Button>
						<div class="h-6 w-px bg-gray-300"></div>
						<h1 class="text-xl font-semibold text-gray-900">OAuth2 클라이언트 관리</h1>
					</div>
					<div class="flex items-center space-x-4">
						<div class="hidden sm:block">
							<span class="text-sm text-gray-600">
								{user.firstName} {user.lastName}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={handleLogout}
							class="border-gray-300 text-gray-700 hover:bg-gray-50"
						>
							<i class="fas fa-sign-out-alt mr-2"></i>
							로그아웃
						</Button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="space-y-6">
				<!-- 페이지 헤더 -->
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">OAuth2 클라이언트</h2>
						<p class="mt-1 text-sm text-gray-600">
							애플리케이션의 OAuth2 클라이언트를 관리하고 모니터링하세요.
						</p>
					</div>
					<Button onclick={openCreateModal}>
						<i class="fas fa-plus mr-2"></i>
						새 클라이언트 생성
					</Button>
				</div>

				<!-- 통계 카드 -->
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
					<Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-apps text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">총 클라이언트</p>
								<p class="text-2xl font-bold">{clients.length}</p>
							</div>
						</div>
					</Card>

					<Card class="bg-gradient-to-r from-green-500 to-green-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-check-circle text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">활성 클라이언트</p>
								<p class="text-2xl font-bold">{clients.filter(c => c.isActive).length}</p>
							</div>
						</div>
					</Card>

					<Card class="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<i class="fas fa-clock text-2xl opacity-80"></i>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium opacity-80">최근 사용됨</p>
								<p class="text-2xl font-bold">{clients.filter(c => c.lastUsed).length}</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- 클라이언트 테이블 -->
				<Card>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">클라이언트 목록</h3>
						{#if isLoadingClients}
							<Loading variant="spinner" size="sm" />
						{/if}
					</div>

					{#if clients.length === 0}
						<div class="py-12 text-center">
							<i class="fas fa-apps mx-auto mb-4 text-4xl text-gray-400"></i>
							<p class="text-lg font-medium text-gray-900">등록된 클라이언트가 없습니다</p>
							<p class="mt-1 text-gray-600">첫 번째 OAuth2 클라이언트를 생성해보세요.</p>
							<Button onclick={openCreateModal} class="mt-4">
								<i class="fas fa-plus mr-2"></i>
								클라이언트 생성
							</Button>
						</div>
					{:else}
						<Table {columns} data={tableData}>
							{#snippet cell({ column, row })}
								{#if column.key === 'name'}
									<div>
										<p class="font-medium text-gray-900">{row.name}</p>
										{#if row._original.description}
											<p class="text-sm text-gray-600">{row._original.description}</p>
										{/if}
									</div>
								{:else if column.key === 'clientId'}
									<div class="flex items-center space-x-2">
										<code class="rounded bg-gray-100 px-2 py-1 text-sm font-mono">{row.clientId}</code>
										<Button
											variant="outline"
											size="sm"
											onclick={() => copyToClipboard(row.clientId)}
											class="p-1"
										>
											<i class="fas fa-copy text-xs"></i>
										</Button>
									</div>
								{:else if column.key === 'scopes'}
									<div class="flex flex-wrap gap-1">
										{#each row.scopes as scope}
											<Badge variant="info" size="sm">{scope}</Badge>
										{/each}
									</div>
								{:else if column.key === 'status'}
									<Badge variant={row.status ? 'success' : 'warning'} size="sm">
										{row.status ? '활성' : '비활성'}
									</Badge>
								{:else if column.key === 'lastUsed'}
									<span class="text-sm text-gray-600">
										{row.lastUsed ? row.lastUsed.toLocaleDateString('ko-KR') : '사용 안함'}
									</span>
								{:else if column.key === 'actions'}
									<Dropdown>
										{#snippet trigger()}
											<Button variant="outline" size="sm">
												<i class="fas fa-ellipsis-v"></i>
											</Button>
										{/snippet}
										{#snippet content()}
											<button
												class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
												onclick={() => openEditModal(row._original)}
											>
												<i class="fas fa-edit mr-2"></i>
												편집
											</button>
											<button
												class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
												onclick={() => toggleClientStatus(row._original)}
											>
												<i class="fas fa-{row.status ? 'pause' : 'play'} mr-2"></i>
												{row.status ? '비활성화' : '활성화'}
											</button>
											<button
												class="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
												onclick={() => deleteClient(row._original)}
											>
												<i class="fas fa-trash mr-2"></i>
												삭제
											</button>
										{/snippet}
									</Dropdown>
								{/if}
							{/snippet}
						</Table>
					{/if}
				</Card>
			</div>
		</main>
	</div>

	<!-- 클라이언트 생성 모달 -->
	{#if showCreateModal}
		<Modal
			title="새 OAuth2 클라이언트 생성"
			open={showCreateModal}
			onClose={closeCreateModal}
			size="lg"
		>
			{#snippet children()}
				<div class="space-y-4">
					<div>
						<label for="clientName" class="block text-sm font-medium text-gray-700 mb-2">
							클라이언트 이름 *
						</label>
						<Input
							id="clientName"
							value={createForm.name}
							placeholder="예: 웹 애플리케이션"
							disabled={isCreating}
							oninput={(e) => {
								createForm.name = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div>
						<label for="clientDescription" class="block text-sm font-medium text-gray-700 mb-2">
							설명
						</label>
						<Input
							id="clientDescription"
							value={createForm.description}
							placeholder="클라이언트에 대한 설명을 입력하세요"
							disabled={isCreating}
							oninput={(e) => {
								createForm.description = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div>
						<label for="redirectUris" class="block text-sm font-medium text-gray-700 mb-2">
							리다이렉트 URI *
						</label>
						<Input
							id="redirectUris"
							value={createForm.redirectUris}
							placeholder="https://example.com/callback, https://app.example.com/auth"
							disabled={isCreating}
							oninput={(e) => {
								createForm.redirectUris = (e.target as HTMLInputElement).value;
							}}
						/>
						<p class="mt-1 text-sm text-gray-600">
							여러 URI는 쉼표로 구분하세요.
						</p>
					</div>

					<div>
						<label for="scopes" class="block text-sm font-medium text-gray-700 mb-2">
							권한 스코프
						</label>
						<Input
							id="scopes"
							value={createForm.scopes}
							placeholder="read, write, admin"
							disabled={isCreating}
							oninput={(e) => {
								createForm.scopes = (e.target as HTMLInputElement).value;
							}}
						/>
						<p class="mt-1 text-sm text-gray-600">
							여러 스코프는 쉼표로 구분하세요.
						</p>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={closeCreateModal} disabled={isCreating}>
					취소
				</Button>
				<Button onclick={createClient} disabled={isCreating}>
					{#if isCreating}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-plus mr-2"></i>
					{/if}
					생성
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- 클라이언트 편집 모달 -->
	{#if showEditModal && editingClient}
		<Modal
			title="클라이언트 편집"
			open={showEditModal}
			onClose={closeEditModal}
			size="lg"
		>
			{#snippet children()}
				<div class="space-y-4">
					<div>
						<label for="editClientName" class="block text-sm font-medium text-gray-700 mb-2">
							클라이언트 이름 *
						</label>
						<Input
							id="editClientName"
							value={editForm.name}
							placeholder="예: 웹 애플리케이션"
							disabled={isUpdating}
							oninput={(e) => {
								editForm.name = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div>
						<label for="editClientDescription" class="block text-sm font-medium text-gray-700 mb-2">
							설명
						</label>
						<Input
							id="editClientDescription"
							value={editForm.description}
							placeholder="클라이언트에 대한 설명을 입력하세요"
							disabled={isUpdating}
							oninput={(e) => {
								editForm.description = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div>
						<label for="editRedirectUris" class="block text-sm font-medium text-gray-700 mb-2">
							리다이렉트 URI *
						</label>
						<Input
							id="editRedirectUris"
							value={editForm.redirectUris}
							placeholder="https://example.com/callback"
							disabled={isUpdating}
							oninput={(e) => {
								editForm.redirectUris = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div>
						<label for="editScopes" class="block text-sm font-medium text-gray-700 mb-2">
							권한 스코프
						</label>
						<Input
							id="editScopes"
							value={editForm.scopes}
							placeholder="read, write, admin"
							disabled={isUpdating}
							oninput={(e) => {
								editForm.scopes = (e.target as HTMLInputElement).value;
							}}
						/>
					</div>

					<div class="rounded-lg bg-gray-50 p-4">
						<h4 class="text-sm font-medium text-gray-900 mb-2">읽기 전용 정보</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Client ID:</span>
								<code class="rounded bg-white px-2 py-1 font-mono text-gray-900">{editingClient.clientId}</code>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">생성일:</span>
								<span class="text-gray-900">{editingClient.createdAt.toLocaleDateString('ko-KR')}</span>
							</div>
						</div>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button variant="outline" onclick={closeEditModal} disabled={isUpdating}>
					취소
				</Button>
				<Button onclick={updateClient} disabled={isUpdating}>
					{#if isUpdating}
						<Loading variant="spinner" size="sm" class="mr-2" />
					{:else}
						<i class="fas fa-save mr-2"></i>
					{/if}
					저장
				</Button>
			{/snippet}
		</Modal>
	{/if}

	<!-- 클라이언트 비밀키 표시 모달 -->
	{#if showSecretModal}
		<Modal
			title="클라이언트 비밀키"
			open={showSecretModal}
			onClose={() => showSecretModal = false}
		>
			{#snippet children()}
				<div class="space-y-4">
					<div class="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
						<div class="flex">
							<i class="fas fa-exclamation-triangle text-yellow-400 mr-2 mt-0.5"></i>
							<div>
								<h4 class="text-sm font-medium text-yellow-800">중요!</h4>
								<p class="text-sm text-yellow-700 mt-1">
									이 비밀키는 다시 표시되지 않습니다. 안전한 곳에 저장하세요.
								</p>
							</div>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							클라이언트 비밀키
						</label>
						<div class="flex items-center space-x-2">
							<code class="flex-1 rounded bg-gray-100 px-3 py-2 font-mono text-sm">{clientSecret}</code>
							<Button
								variant="outline"
								onclick={() => copyToClipboard(clientSecret)}
							>
								<i class="fas fa-copy mr-2"></i>
								복사
							</Button>
						</div>
					</div>
				</div>
			{/snippet}
			{#snippet footer()}
				<Button onclick={() => showSecretModal = false}>
					확인
				</Button>
			{/snippet}
		</Modal>
	{/if}
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<Card class="w-full max-w-md">
			<div class="text-center">
				<i class="fas fa-exclamation-triangle mb-4 text-4xl text-red-500"></i>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인증 필요</h2>
				<p class="mb-4 text-gray-600">로그인이 필요합니다.</p>
				<Button onclick={() => (window.location.href = '/auth/login')}>
					로그인하기
				</Button>
			</div>
		</Card>
	</div>
{/if}