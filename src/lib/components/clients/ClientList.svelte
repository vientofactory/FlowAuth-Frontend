<script lang="ts">
	import { Button, Badge, DashboardSkeleton } from '$lib';
	import type { Client } from '$lib/types/oauth.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faList,
		faInbox,
		faPlus,
		faIdCard,
		faCopy,
		faExternalLinkAlt,
		faCalendar,
		faEdit,
		faKey,
		faPause,
		faPlay,
		faTrash
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		clients: Client[];
		isLoading: boolean;
		showCreateForm: boolean;
		onToggleCreateForm: () => void;
		onEditClient: (client: Client) => void;
		onToggleClientStatus: (client: Client) => void;
		onDeleteClient: (clientId: number) => void;
		onResetClientSecret: (client: Client) => void;
		onCopyToClipboard: (text: string) => void;
	}

	let {
		clients,
		isLoading,
		showCreateForm,
		onToggleCreateForm,
		onEditClient,
		onToggleClientStatus,
		onDeleteClient,
		onResetClientSecret,
		onCopyToClipboard
	}: Props = $props();
</script>

<!-- 클라이언트 목록 -->
<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 p-6 shadow-sm ring-1 ring-gray-100"
>
	<div class="relative">
		<div class="mb-6 flex items-center justify-between">
			<h3 class="flex items-center text-lg font-semibold text-gray-900">
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
					<FontAwesomeIcon icon={faList} class="text-slate-600" />
				</div>
				클라이언트 목록
			</h3>
			<Button
				onclick={onToggleCreateForm}
				size="sm"
				class="hidden lg:inline-flex"
			>
				<FontAwesomeIcon icon={faPlus} class="mr-2" />
				{showCreateForm ? '취소' : '클라이언트 추가'}
			</Button>
		</div>

		{#if isLoading}
			<DashboardSkeleton type="table" count={3} />
		{:else if clients.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
					<FontAwesomeIcon icon={faInbox} class="text-2xl text-gray-400" />
				</div>
				<h4 class="mb-1 text-sm font-medium text-gray-900">등록된 클라이언트가 없습니다</h4>
				<p class="mb-4 text-sm text-gray-500">첫 번째 클라이언트를 생성해보세요.</p>
				<Button onclick={onToggleCreateForm} class="bg-stone-600 text-white hover:bg-stone-700">
					<FontAwesomeIcon icon={faPlus} class="mr-2" />
					첫 번째 클라이언트 생성
				</Button>
			</div>
		{:else}
			<div class="space-y-4">
				{#each clients as client (client.id)}
					<div
						class="group relative overflow-hidden rounded-lg border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 hover:shadow-sm"
					>
						<div
							class="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
						>
							<div class="flex-1">
								<div
									class="mb-3 flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3"
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
									<p class="mb-3 text-sm text-gray-600">{client.description}</p>
								{/if}

								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
											<FontAwesomeIcon icon={faIdCard} class="text-stone-600" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
												Client ID
											</p>
											<div class="mt-1 flex items-center space-x-2">
												<code
													class="flex-1 truncate rounded bg-white/60 px-2 py-1 text-xs text-gray-900"
												>
													{client.clientId}
												</code>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => onCopyToClipboard(client.clientId)}
													class="h-6 w-6 p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
													aria-label="Copy Client ID"
												>
													<FontAwesomeIcon icon={faCopy} class="text-xs" />
												</Button>
											</div>
										</div>
									</div>

									<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
											<FontAwesomeIcon icon={faExternalLinkAlt} class="text-neutral-600" />
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
												리다이렉트 URI
											</p>
											<div class="mt-1 space-y-1">
												{#each client.redirectUris.slice(0, 2) as uri (uri)}
													<p class="truncate text-xs text-gray-900">{uri}</p>
												{/each}
												{#if client.redirectUris.length > 2}
													<p class="text-xs text-gray-500">외 {client.redirectUris.length - 2}개</p>
												{/if}
											</div>
										</div>
									</div>

									<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
											<FontAwesomeIcon icon={faCalendar} class="text-slate-600" />
										</div>
										<div class="flex-1">
											<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">
												생성일
											</p>
											<p class="mt-1 text-sm font-medium text-gray-900">
												{new Date(client.createdAt).toLocaleDateString('ko-KR')}
											</p>
										</div>
									</div>
								</div>
							</div>

							<!-- 액션 버튼들 -->
							<div class="flex flex-wrap gap-2 sm:ml-4 sm:flex-col sm:gap-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => onEditClient(client)}
									class="flex-1 transition-colors hover:border-gray-200 hover:bg-gray-50 sm:flex-none"
									title="수정"
								>
									<FontAwesomeIcon icon={faEdit} class="mr-2" />
									<span class="hidden sm:inline">수정</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => onResetClientSecret(client)}
									class="flex-1 text-orange-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 sm:flex-none"
									title="시크릿 재설정"
								>
									<FontAwesomeIcon icon={faKey} class="mr-2" />
									<span class="hidden sm:inline">시크릿</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => onToggleClientStatus(client)}
									class="flex-1 transition-colors hover:border-neutral-200 hover:bg-neutral-50 sm:flex-none"
									title={client.isActive ? '비활성화' : '활성화'}
								>
									<FontAwesomeIcon icon={client.isActive ? faPause : faPlay} class="mr-2" />
									<span class="hidden sm:inline">{client.isActive ? '비활성화' : '활성화'}</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => onDeleteClient(client.id)}
									class="flex-1 text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:flex-none"
									title="삭제"
								>
									<FontAwesomeIcon icon={faTrash} class="mr-2" />
									<span class="hidden sm:inline">삭제</span>
								</Button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
