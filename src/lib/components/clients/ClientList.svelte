<script lang="ts">
	import { Card, Button, Badge, Loading } from '$lib';
	import type { Client } from '$lib/types/oauth.types';

	interface Props {
		clients: Client[];
		isLoading: boolean;
		onToggleCreateForm: () => void;
		onEditClient: (client: Client) => void;
		onToggleClientStatus: (client: Client) => void;
		onDeleteClient: (clientId: number) => void;
		onCopyToClipboard: (text: string) => void;
	}

	let { clients, isLoading, onToggleCreateForm, onEditClient, onToggleClientStatus, onDeleteClient, onCopyToClipboard }: Props = $props();
</script>

<!-- 클라이언트 목록 -->
<Card>
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-base font-medium text-gray-900 sm:text-lg">클라이언트 목록</h3>
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
			<Button onclick={onToggleCreateForm} class="h-10 sm:h-11">
				<i class="fas fa-plus mr-2"></i>
				첫 번째 클라이언트 생성
			</Button>
		</div>
	{:else}
		<div class="space-y-3 sm:space-y-4">
			{#each clients as client (client.id)}
				<div
					class="rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-md sm:p-4"
				>
					<div
						class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
					>
						<div class="flex-1">
							<div
								class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3"
							>
								<h4 class="text-base font-medium text-gray-900 sm:text-lg">{client.name}</h4>
								<Badge
									variant={client.isActive ? 'success' : 'secondary'}
									size="sm"
									class="self-start"
								>
									{client.isActive ? '활성' : '비활성'}
								</Badge>
							</div>

							{#if client.description}
								<p class="mt-1 text-sm text-gray-600">{client.description}</p>
							{/if}

							<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
								<div>
									<p class="text-xs font-medium text-gray-500">Client ID</p>
									<div class="mt-1 flex items-center space-x-2">
										<code
											class="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs sm:text-sm"
										>
											{client.clientId}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onclick={() => onCopyToClipboard(client.clientId)}
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
											<p class="truncate text-xs text-gray-900 sm:text-sm">{uri}</p>
										{/each}
									</div>
								</div>

								<div>
									<p class="text-xs font-medium text-gray-500">생성일</p>
									<p class="mt-1 text-xs text-gray-900 sm:text-sm">
										{new Date(client.createdAt).toLocaleDateString('ko-KR')}
									</p>
								</div>
							</div>
						</div>

						<!-- 모바일 액션 버튼들 -->
						<div class="flex space-x-2 sm:ml-4 sm:flex-col sm:space-y-2 sm:space-x-0">
							<Button
								variant="outline"
								size="sm"
								onclick={() => onEditClient(client)}
								class="h-9 flex-1 px-3 text-sm sm:h-8 sm:flex-none"
								title="수정"
							>
								<i class="fas fa-edit mr-1 sm:mr-0"></i>
								<span class="sm:hidden">수정</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => onToggleClientStatus(client)}
								class="h-9 flex-1 px-3 text-sm sm:h-8 sm:flex-none"
								title={client.isActive ? '비활성화' : '활성화'}
							>
								<i class="fas {client.isActive ? 'fa-pause' : 'fa-play'} mr-1 sm:mr-0"></i>
								<span class="sm:hidden">{client.isActive ? '비활성화' : '활성화'}</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => onDeleteClient(client.id)}
								class="h-9 flex-1 px-3 text-sm text-red-600 hover:text-red-700 sm:h-8 sm:flex-none"
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