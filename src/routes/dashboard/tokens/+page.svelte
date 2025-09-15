<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Token } from '$lib/types/oauth.types';

	let tokens = $state<Token[]>([]);
	let isLoading = $state(true);

	const toast = useToast();

	onMount(async () => {
		await loadTokens();
	});

	async function loadTokens() {
		try {
			isLoading = true;

			const response = await apiClient.getUserTokens();
			tokens = Array.isArray(response) ? response : [];
		} catch (error) {
			console.error('Failed to load tokens:', error);
			toast.error('토큰 목록을 불러오는데 실패했습니다.');
		} finally {
			isLoading = false;
		}
	}

	async function revokeToken(tokenId: number) {
		if (!confirm('정말로 이 토큰을 취소하시겠습니까?')) {
			return;
		}

		try {
			await apiClient.revokeToken(tokenId);
			toast.success('토큰이 취소되었습니다.');
			await loadTokens(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to revoke token:', error);
			toast.error('토큰 취소에 실패했습니다.');
		}
	}

	async function revokeAllTokens() {
		if (!confirm('정말로 모든 토큰을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		try {
			await apiClient.revokeAllTokens();
			toast.success('모든 토큰이 취소되었습니다.');
			await loadTokens(); // 목록 새로고침
		} catch (error) {
			console.error('Failed to revoke all tokens:', error);
			toast.error('모든 토큰 취소에 실패했습니다.');
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString('ko-KR');
	}

	function isExpired(token: Token): boolean {
		return new Date() > new Date(token.expiresAt);
	}

	function getTokenStatus(token: Token): {
		label: string;
		variant: 'success' | 'warning' | 'secondary';
	} {
		if (isExpired(token)) {
			return { label: '만료됨', variant: 'warning' };
		}
		return { label: '활성', variant: 'success' };
	}

	function getTokenScopes(token: Token): string[] {
		if (!token.scopes) return [];

		// scopes가 이미 배열인 경우
		if (Array.isArray(token.scopes)) {
			return token.scopes.filter((scope) => scope && scope.length > 0);
		}

		// scopes가 문자열인 경우 (쉼표 또는 공백으로 구분)
		if (typeof token.scopes === 'string') {
			return token.scopes.split(/[,\s]+/).filter((scope) => scope.length > 0);
		}

		return [];
	}
</script>

<DashboardLayout
	title="토큰 관리"
	description="발급된 액세스 토큰과 리프레시 토큰을 관리하세요."
	showBackButton={true}
>
	{#snippet headerActions()}
		<div class="flex flex-col gap-2 sm:flex-row">
			<Button
				onclick={revokeAllTokens}
				variant="outline"
				class="w-full sm:w-auto h-10 sm:h-11 border-red-300 text-red-600 hover:bg-red-50"
			>
				<i class="fas fa-ban mr-2"></i>
				모든 토큰 취소
			</Button>
		</div>
	{/snippet}

	<!-- 통계 카드 -->
	<div class="mb-4 sm:mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-100">
						<i class="fas fa-key text-lg sm:text-xl text-blue-600"></i>
					</div>
				</div>
				<div class="ml-2 sm:ml-3 flex-1">
					<p class="text-xs sm:text-sm font-medium text-gray-500">총 토큰</p>
					<p class="text-lg sm:text-xl font-bold text-gray-900">{tokens.length}</p>
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
					<p class="text-xs sm:text-sm font-medium text-gray-500">활성 토큰</p>
					<p class="text-lg sm:text-xl font-bold text-gray-900">
						{tokens.filter((t) => !isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-yellow-100">
						<i class="fas fa-clock text-lg sm:text-xl text-yellow-600"></i>
					</div>
				</div>
				<div class="ml-2 sm:ml-3 flex-1">
					<p class="text-xs sm:text-sm font-medium text-gray-500">만료된 토큰</p>
					<p class="text-lg sm:text-xl font-bold text-gray-900">
						{tokens.filter((t) => isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- 토큰 목록 -->
	<Card>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-base sm:text-lg font-medium text-gray-900">토큰 목록</h3>
		</div>

		{#if isLoading}
			<div class="py-8 text-center">
				<i class="fas fa-spinner fa-spin mb-4 text-2xl text-gray-400"></i>
				<p class="text-gray-500">토큰 목록을 불러오는 중...</p>
			</div>
		{:else if tokens.length === 0}
			<div class="py-8 text-center">
				<i class="fas fa-key mb-4 text-4xl text-gray-400"></i>
				<p class="mb-4 text-gray-500">발급된 토큰이 없습니다.</p>
			</div>
		{:else}
			<div class="space-y-3 sm:space-y-4">
				{#each tokens as token (token.id)}
					<div class="rounded-lg border border-gray-200 p-3 sm:p-4 transition-shadow hover:shadow-md">
						<div class="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
							<div class="flex-1">
								<div class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
									<h4 class="text-base sm:text-lg font-medium text-gray-900">
										{token.client?.name || `Client ${token.clientId}`}
									</h4>
									<div class="flex flex-wrap gap-2">
										<Badge variant="info" size="sm">
											{token.tokenType}
										</Badge>
										<Badge {...getTokenStatus(token)} size="sm">
											{getTokenStatus(token).label}
										</Badge>
									</div>
								</div>

								<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
									<div>
										<p class="text-xs font-medium text-gray-500">토큰 ID</p>
										<p class="font-mono text-xs sm:text-sm text-gray-900 mt-1">#{token.id}</p>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">권한 범위</p>
										<div class="mt-1 flex flex-wrap gap-1">
											{#each getTokenScopes(token) as scope (scope)}
												<Badge variant="secondary" size="sm">{scope}</Badge>
											{:else}
												<span class="text-xs sm:text-sm text-gray-500">없음</span>
											{/each}
										</div>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">생성일</p>
										<p class="text-xs sm:text-sm text-gray-900 mt-1">{formatDate(token.createdAt)}</p>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">만료일</p>
										<p class="text-xs sm:text-sm text-gray-900 mt-1">{formatDate(token.expiresAt)}</p>
									</div>

									{#if token.refreshToken && token.refreshExpiresAt}
										<div class="sm:col-span-2 lg:col-span-4">
											<p class="text-xs font-medium text-gray-500">리프레시 토큰 만료일</p>
											<p class="text-xs sm:text-sm text-gray-900 mt-1">{formatDate(token.refreshExpiresAt)}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- 액션 버튼 -->
							<div class="flex sm:flex-col gap-2 sm:ml-4">
								{#if !isExpired(token)}
									<Button
										variant="outline"
										size="sm"
										onclick={() => revokeToken(token.id)}
										class="flex-1 sm:flex-none h-9 sm:h-8 px-3 text-sm border-red-300 text-red-600 hover:bg-red-50"
									>
										<i class="fas fa-ban mr-1 sm:mr-0"></i>
										<span class="sm:hidden">취소</span>
									</Button>
								{:else}
									<Button
										variant="outline"
										size="sm"
										disabled
										class="flex-1 sm:flex-none h-9 sm:h-8 px-3 text-sm text-gray-400"
									>
										<i class="fas fa-clock mr-1 sm:mr-0"></i>
										<span class="sm:hidden">만료됨</span>
									</Button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
	<!-- 토큰 관리 안내 -->
	<Card class="mt-4 sm:mt-6">
		<h3 class="mb-4 text-base sm:text-lg font-medium text-gray-900">토큰 관리 안내</h3>
		<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
			<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-key mr-2 text-blue-600"></i>
					<h4 class="font-medium text-blue-900 text-sm sm:text-base">액세스 토큰</h4>
				</div>
				<p class="text-xs sm:text-sm text-blue-800">
					API 리소스에 접근하기 위한 토큰입니다. 일반적으로 짧은 수명을 가집니다.
				</p>
			</div>

			<div class="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-redo mr-2 text-green-600"></i>
					<h4 class="font-medium text-green-900 text-sm sm:text-base">리프레시 토큰</h4>
				</div>
				<p class="text-xs sm:text-sm text-green-800">
					새로운 액세스 토큰을 얻기 위한 토큰입니다. 더 긴 수명을 가집니다.
				</p>
			</div>
		</div>

		<div class="mt-3 sm:mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4">
			<div class="mb-2 flex items-center">
				<i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>
				<h4 class="font-medium text-yellow-900 text-sm sm:text-base">보안 주의사항</h4>
			</div>
			<ul class="space-y-1 text-xs sm:text-sm text-yellow-800">
				<li>• 의심스러운 활동이 발견되면 즉시 토큰을 취소하세요.</li>
				<li>• 정기적으로 사용하지 않는 토큰을 정리하세요.</li>
				<li>• 토큰이 유출되었다고 의심되면 모든 토큰을 취소하세요.</li>
			</ul>
		</div>
	</Card>
</DashboardLayout>
