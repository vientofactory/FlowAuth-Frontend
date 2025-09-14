<script lang="ts">
	import { DashboardLayout, Card, Button, Badge } from '$lib';
	import { authState, useToast } from '$lib';
	import { onMount } from 'svelte';

	interface Token {
		id: string;
		clientName: string;
		tokenType: 'access' | 'refresh';
		scopes: string[];
		createdAt: Date;
		expiresAt: Date;
		lastUsed?: Date;
		isActive: boolean;
	}

	let tokens = $state<Token[]>([
		{
			id: '1',
			clientName: 'My Web App',
			tokenType: 'access',
			scopes: ['read', 'write'],
			createdAt: new Date('2024-01-20T10:00:00'),
			expiresAt: new Date('2024-01-20T11:00:00'),
			lastUsed: new Date('2024-01-20T10:30:00'),
			isActive: true
		},
		{
			id: '2',
			clientName: 'Mobile App',
			tokenType: 'access',
			scopes: ['read'],
			createdAt: new Date('2024-01-19T14:00:00'),
			expiresAt: new Date('2024-01-19T15:00:00'),
			lastUsed: new Date('2024-01-19T14:45:00'),
			isActive: false
		},
		{
			id: '3',
			clientName: 'My Web App',
			tokenType: 'refresh',
			scopes: ['read', 'write'],
			createdAt: new Date('2024-01-15T09:00:00'),
			expiresAt: new Date('2024-02-15T09:00:00'),
			lastUsed: new Date('2024-01-20T10:00:00'),
			isActive: true
		}
	]);

	const toast = useToast();

	function revokeToken(tokenId: string) {
		if (!confirm('정말로 이 토큰을 취소하시겠습니까?')) {
			return;
		}

		tokens = tokens.map(token => 
			token.id === tokenId 
				? { ...token, isActive: false }
				: token
		);
		
		toast.success('토큰이 취소되었습니다.');
	}

	function revokeAllTokens() {
		if (!confirm('정말로 모든 토큰을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
			return;
		}

		tokens = tokens.map(token => ({ ...token, isActive: false }));
		toast.success('모든 토큰이 취소되었습니다.');
	}

	function formatDate(date: Date): string {
		return date.toLocaleString('ko-KR');
	}

	function isExpired(token: Token): boolean {
		return new Date() > token.expiresAt;
	}

	function getTokenStatus(token: Token): { label: string; variant: 'success' | 'warning' | 'secondary' } {
		if (!token.isActive) {
			return { label: '취소됨', variant: 'secondary' };
		}
		if (isExpired(token)) {
			return { label: '만료됨', variant: 'warning' };
		}
		return { label: '활성', variant: 'success' };
	}
</script>

<DashboardLayout
	title="토큰 관리"
	description="발급된 액세스 토큰과 리프레시 토큰을 관리하세요."
	showBackButton={true}
>
	{#snippet headerActions()}
		<Button onclick={revokeAllTokens} variant="outline" class="text-red-600 border-red-300 hover:bg-red-50">
			<i class="fas fa-ban mr-2"></i>
			모든 토큰 취소
		</Button>
	{/snippet}

	{#snippet children()}
		<!-- 통계 카드 -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<i class="fas fa-key text-2xl text-blue-600"></i>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">총 토큰</p>
						<p class="text-lg font-semibold text-gray-900">{tokens.length}</p>
					</div>
				</div>
			</Card>
			
			<Card>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<i class="fas fa-check-circle text-2xl text-green-600"></i>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">활성 토큰</p>
						<p class="text-lg font-semibold text-gray-900">
							{tokens.filter(t => t.isActive && !isExpired(t)).length}
						</p>
					</div>
				</div>
			</Card>

			<Card>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<i class="fas fa-clock text-2xl text-yellow-600"></i>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">만료된 토큰</p>
						<p class="text-lg font-semibold text-gray-900">
							{tokens.filter(t => isExpired(t)).length}
						</p>
					</div>
				</div>
			</Card>

			<Card>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<i class="fas fa-ban text-2xl text-red-600"></i>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-500">취소된 토큰</p>
						<p class="text-lg font-semibold text-gray-900">
							{tokens.filter(t => !t.isActive).length}
						</p>
					</div>
				</div>
			</Card>
		</div>

		<!-- 토큰 목록 -->
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-medium text-gray-900">토큰 목록</h3>
			</div>

			{#if tokens.length === 0}
				<div class="text-center py-8">
					<i class="fas fa-key text-4xl text-gray-400 mb-4"></i>
					<p class="text-gray-500 mb-4">발급된 토큰이 없습니다.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each tokens as token}
						<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center space-x-3">
										<h4 class="text-lg font-medium text-gray-900">{token.clientName}</h4>
										<Badge variant="info" size="sm">
											{token.tokenType === 'access' ? '액세스 토큰' : '리프레시 토큰'}
										</Badge>
										<Badge {...getTokenStatus(token)} size="sm">
											{getTokenStatus(token).label}
										</Badge>
									</div>

									<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
										<div>
											<p class="text-xs font-medium text-gray-500">토큰 ID</p>
											<p class="text-sm text-gray-900 font-mono">{token.id}</p>
										</div>

										<div>
											<p class="text-xs font-medium text-gray-500">권한 범위</p>
											<div class="flex flex-wrap gap-1 mt-1">
												{#each token.scopes as scope}
													<Badge variant="secondary" size="sm">{scope}</Badge>
												{/each}
											</div>
										</div>

										<div>
											<p class="text-xs font-medium text-gray-500">생성일</p>
											<p class="text-sm text-gray-900">{formatDate(token.createdAt)}</p>
										</div>

										<div>
											<p class="text-xs font-medium text-gray-500">만료일</p>
											<p class="text-sm text-gray-900">{formatDate(token.expiresAt)}</p>
										</div>

										{#if token.lastUsed}
											<div>
												<p class="text-xs font-medium text-gray-500">마지막 사용</p>
												<p class="text-sm text-gray-900">{formatDate(token.lastUsed)}</p>
											</div>
										{/if}
									</div>
								</div>

								<div class="ml-4">
									{#if token.isActive && !isExpired(token)}
										<Button
											variant="outline"
											size="sm"
											onclick={() => revokeToken(token.id)}
											class="text-red-600 border-red-300 hover:bg-red-50"
										>
											<i class="fas fa-ban mr-2"></i>
											취소
										</Button>
									{:else}
										<Button
											variant="outline"
											size="sm"
											disabled
											class="text-gray-400"
										>
											<i class="fas fa-ban mr-2"></i>
											취소됨
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
		<Card class="mt-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">토큰 관리 안내</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="p-4 border border-blue-200 rounded-lg bg-blue-50">
					<div class="flex items-center mb-2">
						<i class="fas fa-key text-blue-600 mr-2"></i>
						<h4 class="font-medium text-blue-900">액세스 토큰</h4>
					</div>
					<p class="text-sm text-blue-800">
						API 리소스에 접근하기 위한 토큰입니다. 일반적으로 짧은 수명을 가집니다.
					</p>
				</div>

				<div class="p-4 border border-green-200 rounded-lg bg-green-50">
					<div class="flex items-center mb-2">
						<i class="fas fa-redo text-green-600 mr-2"></i>
						<h4 class="font-medium text-green-900">리프레시 토큰</h4>
					</div>
					<p class="text-sm text-green-800">
						새로운 액세스 토큰을 얻기 위한 토큰입니다. 더 긴 수명을 가집니다.
					</p>
				</div>
			</div>
			
			<div class="mt-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
				<div class="flex items-center mb-2">
					<i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
					<h4 class="font-medium text-yellow-900">보안 주의사항</h4>
				</div>
				<ul class="text-sm text-yellow-800 space-y-1">
					<li>• 의심스러운 활동이 발견되면 즉시 토큰을 취소하세요.</li>
					<li>• 정기적으로 사용하지 않는 토큰을 정리하세요.</li>
					<li>• 토큰이 유출되었다고 의심되면 모든 토큰을 취소하세요.</li>
				</ul>
			</div>
		</Card>
	{/snippet}
</DashboardLayout>