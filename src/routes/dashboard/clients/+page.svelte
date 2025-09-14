<script lang="ts">
	import { DashboardLayout, Card, Button, Input, Badge } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';

	let clients = $state([
		{
			id: '1',
			name: 'My Web App',
			description: '웹 애플리케이션용 클라이언트',
			clientId: 'web_app_12345',
			scopes: ['read', 'write'],
			isActive: true,
			lastUsed: new Date('2024-01-20')
		},
		{
			id: '2',
			name: 'Mobile App',
			description: '모바일 앱용 클라이언트',
			clientId: 'mobile_app_67890',
			scopes: ['read'],
			isActive: true,
			lastUsed: new Date('2024-01-18')
		}
	]);

	let showCreateForm = $state(false);
	let newClient = $state({
		name: '',
		description: '',
		redirectUris: '',
		scopes: 'read'
	});

	const toast = useToast();

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
			scopes: 'read'
		};
	}

	function createClient() {
		if (!newClient.name.trim()) {
			toast.error('클라이언트 이름을 입력해주세요.');
			return;
		}

		// TODO: 실제 API 호출
		toast.success('클라이언트가 성공적으로 생성되었습니다.');
		showCreateForm = false;
		resetForm();
	}

	function deleteClient(clientId: string) {
		if (!confirm('정말로 이 클라이언트를 삭제하시겠습니까?')) {
			return;
		}
		
		clients = clients.filter(c => c.id !== clientId);
		toast.success('클라이언트가 삭제되었습니다.');
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		toast.success('클립보드에 복사되었습니다.');
	}
</script>

<DashboardLayout
	title="클라이언트 관리"
	description="OAuth2 클라이언트 애플리케이션을 관리하고 설정하세요."
>
	{#snippet headerActions()}
		<Button onclick={toggleCreateForm}>
			<i class="fas fa-plus mr-2"></i>
			{showCreateForm ? '취소' : '새 클라이언트 생성'}
		</Button>
	{/snippet}

	{#snippet children()}
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
							{clients.filter(c => c.isActive).length}
						</p>
					</div>
				</div>
			</Card>
		</div>

		<!-- 새 클라이언트 생성 폼 -->
		{#if showCreateForm}
			<Card class="mb-6">
				<h3 class="mb-4 text-lg font-medium text-gray-900">새 클라이언트 생성</h3>
				<form onsubmit={(e) => { e.preventDefault(); createClient(); }}>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label class="block text-sm font-medium text-gray-700">클라이언트 이름 *</label>
							<input
								type="text"
								bind:value={newClient.name}
								placeholder="예: My Web Application"
								required
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700">설명</label>
							<input
								type="text"
								bind:value={newClient.description}
								placeholder="클라이언트 애플리케이션에 대한 설명"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
						</div>

						<div class="sm:col-span-2">
							<label class="block text-sm font-medium text-gray-700">리다이렉트 URI *</label>
							<textarea
								bind:value={newClient.redirectUris}
								placeholder="https://example.com/callback"
								rows="3"
								required
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							></textarea>
							<p class="mt-1 text-xs text-gray-500">한 줄에 하나씩 입력해주세요.</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700">권한 범위</label>
							<input
								type="text"
								bind:value={newClient.scopes}
								placeholder="read write"
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							/>
							<p class="mt-1 text-xs text-gray-500">공백으로 구분하여 입력해주세요.</p>
						</div>
					</div>

					<div class="mt-4 flex justify-end space-x-2">
						<Button variant="outline" onclick={toggleCreateForm}>
							취소
						</Button>
						<Button type="submit">
							생성
						</Button>
					</div>
				</form>
			</Card>
		{/if}

		<!-- 클라이언트 목록 -->
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium text-gray-900">클라이언트 목록</h3>
			</div>

			{#if clients.length === 0}
				<div class="text-center py-8">
					<i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
					<p class="text-gray-500 mb-4">등록된 클라이언트가 없습니다.</p>
					<Button onclick={toggleCreateForm}>
						첫 번째 클라이언트 생성
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each clients as client}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
												<code class="text-sm bg-gray-100 rounded px-2 py-1">{client.clientId}</code>
												<button
													onclick={() => copyToClipboard(client.clientId)}
													class="text-gray-400 hover:text-gray-600"
												>
													<i class="fas fa-copy text-xs"></i>
												</button>
											</div>
										</div>

										<div>
											<p class="text-xs font-medium text-gray-500">권한 범위</p>
											<div class="flex flex-wrap gap-1 mt-1">
												{#each client.scopes as scope}
													<Badge variant="info" size="sm">{scope}</Badge>
												{/each}
											</div>
										</div>

										<div>
											<p class="text-xs font-medium text-gray-500">마지막 사용</p>
											<p class="text-sm text-gray-900">
												{client.lastUsed ? client.lastUsed.toLocaleDateString('ko-KR') : '사용 안함'}
											</p>
										</div>
									</div>
								</div>

								<div class="ml-4 flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => {}}
									>
										<i class="fas fa-edit"></i>
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => {}}
									>
										<i class="fas fa-key"></i>
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={() => deleteClient(client.id)}
										class="text-red-600 hover:text-red-700"
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
	{/snippet}
</DashboardLayout>