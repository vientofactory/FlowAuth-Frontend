<script lang="ts">
	import { DashboardLayout, Card, Button, Badge, apiClient } from '$lib';
	import { useToast } from '$lib';
	import { onMount } from 'svelte';
	import type { Token } from '$lib/types/oauth.types';
	import { authState } from '$lib';
	import type { User } from '$lib';

	let _user = $state<User | null>(null);
	let tokens = $state<Token[]>([]);
	let isLoading = $state(true);

	const toast = useToast();

	onMount(() => {
		// 사용자 정보 구독
		const unsubscribe = authState.subscribe((state) => {
			_user = state.user;
		});

		loadTokens();
		
		// cleanup 함수 반환
		return () => {
			unsubscribe();
		};
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
				class="h-10 w-full border-red-300 text-red-600 hover:bg-red-50 sm:h-11 sm:w-auto"
			>
				<i class="fas fa-ban mr-2"></i>
				모든 토큰 취소
			</Button>
		</div>
	{/snippet}

	<!-- 통계 카드 -->
	<div class="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-key text-lg text-blue-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">총 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">{tokens.length}</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-check-circle text-lg text-green-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">활성 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">
						{tokens.filter((t) => !isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>

		<Card class="p-3 sm:p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 sm:h-10 sm:w-10"
					>
						<i class="fas fa-clock text-lg text-yellow-600 sm:text-xl"></i>
					</div>
				</div>
				<div class="ml-2 flex-1 sm:ml-3">
					<p class="text-xs font-medium text-gray-500 sm:text-sm">만료된 토큰</p>
					<p class="text-lg font-bold text-gray-900 sm:text-xl">
						{tokens.filter((t) => isExpired(t)).length}
					</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- 토큰 목록 -->
	<Card>
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-base font-medium text-gray-900 sm:text-lg">토큰 목록</h3>
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
									<h4 class="text-base font-medium text-gray-900 sm:text-lg">
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
										<p class="mt-1 font-mono text-xs text-gray-900 sm:text-sm">#{token.id}</p>
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
										<p class="mt-1 text-xs text-gray-900 sm:text-sm">
											{formatDate(token.createdAt)}
										</p>
									</div>

									<div>
										<p class="text-xs font-medium text-gray-500">만료일</p>
										<p class="mt-1 text-xs text-gray-900 sm:text-sm">
											{formatDate(token.expiresAt)}
										</p>
									</div>

									{#if token.refreshToken && token.refreshExpiresAt}
										<div class="sm:col-span-2 lg:col-span-4">
											<p class="text-xs font-medium text-gray-500">리프레시 토큰 만료일</p>
											<p class="mt-1 text-xs text-gray-900 sm:text-sm">
												{formatDate(token.refreshExpiresAt)}
											</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- 액션 버튼 -->
							<div class="flex gap-2 sm:ml-4 sm:flex-col">
								{#if !isExpired(token)}
									<Button
										variant="outline"
										size="sm"
										onclick={() => revokeToken(token.id)}
										class="h-9 flex-1 border-red-300 px-3 text-sm text-red-600 hover:bg-red-50 sm:h-8 sm:flex-none"
									>
										<i class="fas fa-ban mr-1 sm:mr-0"></i>
										<span class="sm:hidden">취소</span>
									</Button>
								{:else}
									<Button
										variant="outline"
										size="sm"
										disabled
										class="h-9 flex-1 px-3 text-sm text-gray-400 sm:h-8 sm:flex-none"
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
		<h3 class="mb-4 text-base font-medium text-gray-900 sm:text-lg">토큰 관리 안내</h3>
		<div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
			<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-key mr-2 text-blue-600"></i>
					<h4 class="text-sm font-medium text-blue-900 sm:text-base">액세스 토큰</h4>
				</div>
				<p class="text-xs text-blue-800 sm:text-sm">
					API 리소스에 접근하기 위한 토큰입니다. 일반적으로 짧은 수명을 가집니다.
				</p>
			</div>

			<div class="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
				<div class="mb-2 flex items-center">
					<i class="fas fa-redo mr-2 text-green-600"></i>
					<h4 class="text-sm font-medium text-green-900 sm:text-base">리프레시 토큰</h4>
				</div>
				<p class="text-xs text-green-800 sm:text-sm">
					새로운 액세스 토큰을 얻기 위한 토큰입니다. 더 긴 수명을 가집니다.
				</p>
			</div>
		</div>

		<div class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:mt-4 sm:p-4">
			<div class="mb-2 flex items-center">
				<i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>
				<h4 class="text-sm font-medium text-yellow-900 sm:text-base">보안 주의사항</h4>
			</div>
			<ul class="space-y-1 text-xs text-yellow-800 sm:text-sm">
				<li>• 의심스러운 활동이 발견되면 즉시 토큰을 취소하세요.</li>
				<li>• 정기적으로 사용하지 않는 토큰을 정리하세요.</li>
				<li>• 토큰이 유출되었다고 의심되면 모든 토큰을 취소하세요.</li>
			</ul>
		</div>
	</Card>
</DashboardLayout>
