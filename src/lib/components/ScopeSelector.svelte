<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes, faCheck, faPlus, faKey } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		selectedScopes: string[];
		onScopeToggle: (scope: string) => void;
		availableScopes?: { id: string; name: string; description: string }[];
		error?: string;
		disabled?: boolean;
	}

	let {
		selectedScopes = $bindable([]),
		onScopeToggle,
		availableScopes,
		error,
		disabled = false
	}: Props = $props();

	// 스코프 목록이 제공되지 않은 경우 기본 스코프들 사용 (하위 호환성)
	const allScopes = availableScopes || [
		{ id: 'openid', name: 'OpenID Connect', description: 'OpenID Connect 인증을 위한 기본 스코프' },
		{
			id: 'profile',
			name: '프로필 정보 읽기',
			description: '사용자 프로필 정보 (이름, 생년월일, 지역, 사진 등) 접근'
		},
		{ id: 'email', name: '이메일 주소 읽기', description: '사용자 이메일 주소 접근' }
	];

	// 스코프가 선택되었는지 확인
	function isScopeSelected(scopeId: string): boolean {
		return selectedScopes.includes(scopeId);
	}

	// 스코프 토글 핸들러
	function handleScopeToggle(scopeId: string) {
		if (disabled) return;
		onScopeToggle(scopeId);
	}
</script>

<div class="space-y-4">
	<label for="scope-selector" class="block text-sm font-medium text-gray-700"> 권한 범위 * </label>

	<!-- 선택된 스코프 표시 -->
	{#if selectedScopes.length > 0}
		<div class="mb-3">
			<p class="mb-2 text-xs text-gray-500">선택된 권한 ({selectedScopes.length})</p>
			<div class="flex flex-wrap gap-2">
				{#each selectedScopes as scopeId (scopeId)}
					{@const scope = allScopes.find((s) => s.id === scopeId)}
					{#if scope}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
						>
							{scope.name}
							<button
								type="button"
								onclick={() => handleScopeToggle(scopeId)}
								{disabled}
								class="ml-1 text-blue-500 hover:text-blue-700"
								aria-label="{scope.name} 제거"
							>
								<FontAwesomeIcon icon={faTimes} class="text-xs" />
							</button>
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- 스코프 선택 영역 -->
	<div id="scope-selector" class="max-h-64 overflow-y-auto rounded-md border border-gray-200">
		<div class="p-3">
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#each allScopes as scope (scope.id)}
					{@const isSelected = isScopeSelected(scope.id)}
					<button
						type="button"
						onclick={() => handleScopeToggle(scope.id)}
						{disabled}
						class="flex items-center space-x-3 rounded-lg border p-3 text-left transition-all hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none {isSelected
							? 'border-blue-300 bg-blue-50'
							: 'border-gray-200'}"
					>
						<div class="shrink-0">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
							>
								<FontAwesomeIcon icon={faKey} class="text-sm text-white" />
							</div>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-gray-900">
								{scope.name}
							</p>
							<p class="truncate text-xs text-gray-600">
								{scope.description}
							</p>
						</div>
						<div class="shrink-0">
							{#if isSelected}
								<FontAwesomeIcon icon={faCheck} class="text-blue-600" />
							{:else}
								<FontAwesomeIcon icon={faPlus} class="text-gray-400" />
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{:else}
		<p class="mt-1 text-xs text-gray-500">필요한 권한 범위를 선택해주세요.</p>
	{/if}
</div>
