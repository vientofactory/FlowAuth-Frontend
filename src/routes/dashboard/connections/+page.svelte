<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import { DashboardLayout, Modal } from '$lib';
	import type {
		ConnectedAppDto,
		ConnectedAppsResponse,
		RevokeConnectionResponse
	} from '$lib/types/dashboard';

	let apps: ConnectedAppDto[] = [];
	let loading = true;
	let error = '';

	// 모달 관련 상태
	let showRevokeModal = false;
	let revokingApp: ConnectedAppDto | null = null;
	let revoking = false;

	onMount(async () => {
		try {
			const response = await apiClient.request<ConnectedAppsResponse>('/dashboard/connected-apps', {
				method: 'GET'
			});
			apps = response.apps;
		} catch (err) {
			console.error('연결된 앱 목록 조회 실패:', err);
			error = '연결된 앱 목록을 불러오는데 실패했습니다.';
		} finally {
			loading = false;
		}
	});

	function openRevokeModal(app: ConnectedAppDto) {
		revokingApp = app;
		showRevokeModal = true;
	}

	function closeRevokeModal() {
		showRevokeModal = false;
		revokingApp = null;
		revoking = false;
	}

	async function confirmRevokeConnection() {
		if (!revokingApp) return;

		revoking = true;
		try {
			await apiClient.request<RevokeConnectionResponse>(
				`/dashboard/connected-apps/${revokingApp.id}`,
				{
					method: 'DELETE'
				}
			);
			// 연결 해제 성공 시 목록에서 제거
			apps = apps.filter((app) => app.id !== revokingApp!.id);
			closeRevokeModal();
		} catch (err) {
			console.error('연결 해제 실패:', err);
			alert('연결 해제에 실패했습니다. 다시 시도해주세요.');
		} finally {
			revoking = false;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'text-green-600 bg-green-100';
			case 'expired':
				return 'text-red-600 bg-red-100';
			case 'revoked':
				return 'text-gray-600 bg-gray-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	}

	function getStatusText(status: string): string {
		switch (status) {
			case 'active':
				return '활성';
			case 'expired':
				return '만료됨';
			case 'revoked':
				return '취소됨';
			default:
				return '알 수 없음';
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<DashboardLayout title="연결된 앱" description="귀하의 계정에 연결된 애플리케이션들을 관리하세요">
	<div class="space-y-6">
		<!-- 로딩 상태 -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="flex items-center space-x-3">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<span class="text-gray-600">연결된 앱을 불러오는 중...</span>
				</div>
			</div>
		{:else if error}
			<!-- 에러 상태 -->
			<div class="rounded-lg border border-red-200 bg-red-50 p-6">
				<div class="flex items-center">
					<i class="fas fa-exclamation-triangle mr-3 text-red-500"></i>
					<div>
						<h3 class="text-sm font-medium text-red-800">오류 발생</h3>
						<p class="mt-1 text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		{:else if apps.length === 0}
			<!-- 빈 상태 -->
			<div class="py-12 text-center">
				<i class="fas fa-plug mb-4 text-6xl text-gray-400"></i>
				<h3 class="mb-2 text-lg font-medium text-gray-900">연결된 앱이 없습니다</h3>
				<p class="mb-6 text-gray-600">
					아직 어떤 앱에도 연결되지 않았습니다.<br />
					OAuth2 애플리케이션을 사용하면 여기에 표시됩니다.
				</p>
				<a
					href="/dashboard/oauth-tester"
					class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					<i class="fas fa-flask mr-2"></i>
					OAuth2 테스터로 이동
				</a>
			</div>
		{:else}
			<!-- 앱 목록 -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each apps as app (app.id)}
					<div
						class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
					>
						<!-- 앱 헤더 -->
						<div class="border-b border-gray-200 p-6">
							<div class="flex items-start justify-between">
								<div class="flex items-center space-x-3">
									{#if app.logoUrl}
										<img
											src={app.logoUrl}
											alt="{app.name} 로고"
											class="h-10 w-10 rounded-lg object-cover"
										/>
									{:else}
										<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
											<i class="fas fa-plug text-gray-400"></i>
										</div>
									{/if}
									<div>
										<h3 class="text-lg font-semibold text-gray-900">{app.name}</h3>
										{#if app.description}
											<p class="mt-1 text-sm text-gray-600">{app.description}</p>
										{/if}
									</div>
								</div>
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
										app.status
									)}"
								>
									{getStatusText(app.status)}
								</span>
							</div>
						</div>

						<!-- 앱 정보 -->
						<div class="space-y-4 p-6">
							<!-- 권한 범위 -->
							<div>
								<h4 class="mb-2 text-sm font-medium text-gray-900">권한 범위</h4>
								<div class="flex flex-wrap gap-1">
									{#each app.scopes as scope (scope)}
										<span
											class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
										>
											{scope}
										</span>
									{/each}
								</div>
							</div>

							<!-- 연결 정보 -->
							<div class="space-y-2 text-sm text-gray-600">
								<div class="flex justify-between">
									<span>연결 일시:</span>
									<span>{formatDate(app.connectedAt)}</span>
								</div>
								<div class="flex justify-between">
									<span>만료 일시:</span>
									<span>{formatDate(app.expiresAt)}</span>
								</div>
							</div>

							<!-- 액션 버튼 -->
							<div class="border-t border-gray-200 pt-4">
								<button
									onclick={() => openRevokeModal(app)}
									class="inline-flex w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
									disabled={app.status === 'revoked'}
								>
									<i class="fas fa-unlink mr-2"></i>
									연결 해제
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- 요약 정보 -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">연결 요약</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="text-center">
						<div class="text-2xl font-bold text-blue-600">{apps.length}</div>
						<div class="text-sm text-gray-600">총 연결 앱</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-green-600">
							{apps.filter((app) => app.status === 'active').length}
						</div>
						<div class="text-sm text-gray-600">활성 연결</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-red-600">
							{apps.filter((app) => app.status === 'expired' || app.status === 'revoked').length}
						</div>
						<div class="text-sm text-gray-600">만료/취소됨</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- 연결 해제 확인 모달 -->
	<Modal open={showRevokeModal} title="연결 해제 확인" size="md" onClose={closeRevokeModal}>
		{#if revokingApp}
			<div class="space-y-4">
				<div class="flex items-center space-x-3">
					{#if revokingApp.logoUrl}
						<img
							src={revokingApp.logoUrl}
							alt="{revokingApp.name} 로고"
							class="h-10 w-10 rounded-lg object-cover"
						/>
					{:else}
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
							<i class="fas fa-plug text-gray-400"></i>
						</div>
					{/if}
					<div>
						<h3 class="text-lg font-semibold text-gray-900">{revokingApp.name}</h3>
						{#if revokingApp.description}
							<p class="text-sm text-gray-600">{revokingApp.description}</p>
						{/if}
					</div>
				</div>

				<div class="rounded-md bg-yellow-50 p-4">
					<div class="flex">
						<i class="fas fa-exclamation-triangle text-yellow-400"></i>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">주의</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p>
									<strong>{revokingApp.name}</strong> 앱과 연결을 해제하시겠습니까?
								</p>
								<p class="mt-1">
									연결 해제 시 해당 앱에서 발급받은 모든 토큰이 취소되며, 더 이상 해당 앱을 사용할
									수 없습니다.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#snippet footer()}
			<div class="flex justify-end space-x-3">
				<button
					onclick={closeRevokeModal}
					class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					disabled={revoking}
				>
					취소
				</button>
				<button
					onclick={confirmRevokeConnection}
					disabled={revoking}
					class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{#if revoking}
						<i class="fas fa-spinner fa-spin mr-2"></i>
						해제 중...
					{:else}
						<i class="fas fa-unlink mr-2"></i>
						연결 해제
					{/if}
				</button>
			</div>
		{/snippet}
	</Modal>
</DashboardLayout>
