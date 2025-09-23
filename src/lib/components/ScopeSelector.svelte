<script lang="ts">
	import { getScopeInfo, groupScopesByCategory, SCOPE_CATEGORIES, type ScopeInfo } from '$lib/utils/scope.utils';

	interface Props {
		selectedScopes: string[];
		onScopeToggle: (scope: string) => void;
		error?: string;
		disabled?: boolean;
	}

	let { selectedScopes = $bindable([]), onScopeToggle, error, disabled = false }: Props = $props();

	// 모든 스코프 목록
	const allScopes = [
		'read:user', 'read:profile',
		'upload:file', 'read:file', 'delete:file',
		'read:client', 'write:client', 'delete:client',
		'basic', 'email'
	];

	// 스코프를 카테고리별로 그룹화
	let groupedScopes = $derived(groupScopesByCategory(allScopes));

	// 스코프 아이콘 색상 클래스 가져오기 함수
	function getScopeColorClasses(color: string) {
		const colorMap = {
			blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
			orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
			green: 'bg-green-100 text-green-600 hover:bg-green-200',
			purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
			indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
			red: 'bg-red-100 text-red-600 hover:bg-red-200',
			gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
			cyan: 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
		};

		return colorMap[color as keyof typeof colorMap] || colorMap.gray;
	}

	// 카테고리 이름 매핑
	function getCategoryName(category: string): string {
		const categoryNames = {
			[SCOPE_CATEGORIES.USER]: '사용자 권한',
			[SCOPE_CATEGORIES.PROFILE]: '프로필 권한',
			[SCOPE_CATEGORIES.FILE]: '파일 권한',
			[SCOPE_CATEGORIES.CLIENT]: '클라이언트 권한',
			[SCOPE_CATEGORIES.ADMIN]: '관리자 권한',
			[SCOPE_CATEGORIES.OPENID]: 'OpenID Connect',
			[SCOPE_CATEGORIES.LEGACY]: '레거시 권한'
		};

		return categoryNames[category as keyof typeof categoryNames] || category;
	}

	// 스코프가 선택되었는지 확인
	function isScopeSelected(scope: string): boolean {
		return selectedScopes.includes(scope);
	}

	// 스코프 토글 핸들러
	function handleScopeToggle(scope: string) {
		if (disabled) return;
		onScopeToggle(scope);
	}
</script>

<div class="space-y-4">
	<label for="scope-selector" class="block text-sm font-medium text-gray-700">
		권한 범위 *
	</label>

	<!-- 선택된 스코프 표시 -->
	{#if selectedScopes.length > 0}
		<div class="mb-3">
			<p class="text-xs text-gray-500 mb-2">선택된 권한 ({selectedScopes.length})</p>
			<div class="flex flex-wrap gap-2">
				{#each selectedScopes as scope (scope)}
					{@const scopeInfo = getScopeInfo(scope)}
					<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
						<i class="fas {scopeInfo.icon} text-xs"></i>
						{scopeInfo.name}
						<button
							type="button"
							onclick={() => handleScopeToggle(scope)}
							disabled={disabled}
							class="ml-1 text-blue-500 hover:text-blue-700"
							aria-label="{scopeInfo.name} 제거"
						>
							<i class="fas fa-times text-xs"></i>
						</button>
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 스코프 선택 영역 -->
	<div id="scope-selector" class="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
		{#each Object.entries(groupedScopes) as [category, scopes] (category)}
			<div class="border-b border-gray-100 last:border-b-0">
				<div class="bg-gray-50 px-3 py-2">
					<h4 class="text-sm font-medium text-gray-900">{getCategoryName(category)}</h4>
				</div>
				<div class="p-3">
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each scopes as scope (scope)}
							{@const scopeInfo = getScopeInfo(scope)}
							{@const isSelected = isScopeSelected(scope)}
							<button
								type="button"
								onclick={() => handleScopeToggle(scope)}
								disabled={disabled}
								class="flex items-center space-x-3 rounded-lg border p-3 text-left transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}"
							>
								<div class="flex-shrink-0">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full {getScopeColorClasses(scopeInfo.color)}"
									>
										<i class="fas {scopeInfo.icon} text-sm"></i>
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 truncate">
										{scopeInfo.name}
									</p>
									<p class="text-xs text-gray-600 truncate">
										{scopeInfo.description}
									</p>
									{#if scopeInfo.sensitive}
										<span class="inline-flex items-center text-xs text-red-600 mt-1">
											<i class="fas fa-exclamation-triangle mr-1"></i>
											민감한 권한
										</span>
									{/if}
								</div>
								<div class="flex-shrink-0">
									{#if isSelected}
										<i class="fas fa-check text-blue-600"></i>
									{:else}
										<i class="fas fa-plus text-gray-400"></i>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{:else}
		<p class="mt-1 text-xs text-gray-500">필요한 권한 범위를 선택해주세요.</p>
	{/if}
</div>