<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Client } from '$lib/types/oauth.types';

	let clients = $state<Client[]>([]);
	let isLoading = $state(true);

	let showCreateForm = $state(false);
	let newClient = $state({
		name: '',
		description: '',
		redirectUris: '',
		grants: ['authorization_code'],
		scopes: 'read write'
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
		newClient = {
			name: '',
			description: '',
			redirectUris: '',
			grants: ['authorization_code'],
			scopes: 'read write'
		};
	}

	async function createClient() {
		if (!newClient.name.trim()) {
			toast.error('클라이언트 이름을 입력해주세요.');
			return;
		}

		if (!newClient.redirectUris.trim()) {
			toast.error('리다이렉트 URI를 입력해주세요.');
			return;
		}

		if (!newClient.scopes.trim()) {
			toast.error('권한 범위를 입력해주세요.');
			return;
		}

		try {
			const redirectUris = newClient.redirectUris
				.split('\n')
				.map((uri) => uri.trim())
				.filter((uri) => uri.length > 0);

			const scopes = newClient.scopes
				.split(' ')
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0);

			await apiClient.createClient({
				name: newClient.name,
				description: newClient.description || undefined,
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
		<div class="flex gap-2">
			<!-- 임시 디버깅 버튼들 -->
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
	{/snippet}

	<!-- 통계 카드 -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<i class="fas fa-users text-2xl text-blue-600"></i>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-500">총 클라이언트</p>
					<p class="text-lg font-semibold text-gray-900">{clients.length}</p>
				</div>
			</div>
		</Card>

		<Card>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<i class="fas fa-check-circle text-2xl text-green-600"></i>
				</div>
				<div class="ml-3">
					<p class="text-sm font-medium text-gray-500">활성 클라이언트</p>
					<p class="text-lg font-semibold text-gray-900">
						{clients.filter((c) => c.isActive).length}
					</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- 새 클라이언트 생성 폼 -->
	{#if showCreateForm}
		<Card class="mb-6">
			<h3 class="mb-4 text-lg font-medium text-gray-900">새 클라이언트 생성</h3>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					createClient();
				}}
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="client-name" class="block text-sm font-medium text-gray-700"
							>클라이언트 이름 *</label
						>
						<input
							id="client-name"
							type="text"
							bind:value={newClient.name}
							placeholder="예: My Web Application"
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="client-description" class="block text-sm font-medium text-gray-700"
							>설명</label
						>
						<input
							id="client-description"
							type="text"
							bind:value={newClient.description}
							placeholder="클라이언트 애플리케이션에 대한 설명"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div class="sm:col-span-2">
						<label for="client-redirect-uris" class="block text-sm font-medium text-gray-700"
							>리다이렉트 URI *</label
						>
						<textarea
							id="client-redirect-uris"
							bind:value={newClient.redirectUris}
							placeholder="https://example.com/callback"
							rows="3"
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">한 줄에 하나씩 입력해주세요.</p>
					</div>

					<div>
						<label for="client-scopes" class="block text-sm font-medium text-gray-700"
							>권한 범위</label
						>
						<input
							id="client-scopes"
							type="text"
							bind:value={newClient.scopes}
							placeholder="read write"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">공백으로 구분하여 입력해주세요.</p>
					</div>
				</div>

				<div class="mt-4 flex justify-end space-x-2">
					<Button variant="outline" onclick={toggleCreateForm}>취소</Button>
					<Button type="submit">생성</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- 클라이언트 목록 -->
	<Card>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-medium text-gray-900">클라이언트 목록</h3>
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
				<Button onclick={toggleCreateForm}>첫 번째 클라이언트 생성</Button>
			</div>
		{:else}
			<div class="space-y-4">
				{#each clients as client (client.id)}
					<div class="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center space-x-3">
									<h4 class="text-lg font-medium text-gray-900">{client.name}</h4>
									<Badge variant={client.isActive ? 'success' : 'secondary'} size="sm">
										{client.isActive ? '활성' : '비활성'}
									</Badge>
								</div>

								{#if client.description}
									<p class="mt-1 text-sm text-gray-600">{client.description}</p>
								{/if}

								<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									<div>
										<p class="text-xs font-medium text-gray-500">Client ID</p>
										<div class="flex items-center space-x-2">
											<code class="rounded bg-gray-100 px-2 py-1 text-sm">{client.clientId}</code>
											<button
												onclick={() => copyToClipboard(client.clientId)}
												class="text-gray-400 hover:text-gray-600"
												aria-label="Copy Client ID"
											>
												<i class="fas fa-copy text-xs"></i>
											</button>
										</div>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">리다이렉트 URI</p>
										<div class="mt-1">
											{#each client.redirectUris as uri (uri)}
												<p class="truncate text-sm text-gray-900">{uri}</p>
											{/each}
										</div>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">생성일</p>
										<p class="text-sm text-gray-900">
											{new Date(client.createdAt).toLocaleDateString('ko-KR')}
										</p>
									</div>
								</div>
							</div>

							<div class="ml-4 flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => toggleClientStatus(client)}
									title={client.isActive ? '비활성화' : '활성화'}
								>
									<i class="fas {client.isActive ? 'fa-pause' : 'fa-play'}"></i>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => deleteClient(client.id)}
									class="text-red-600 hover:text-red-700"
									title="삭제"
								>
									<i class="fas fa-trash"></i>
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</DashboardLayout>
