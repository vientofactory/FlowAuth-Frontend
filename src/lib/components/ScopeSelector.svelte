<script lang="ts">
	import { onMount } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTimes, faCheck, faPlus, faKey } from '@fortawesome/free-solid-svg-icons';
	import { DEFAULT_SCOPES } from '$lib/constants/authorization.constants';

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

	let serverScopes = $state<{ id: string; name: string; description: string }[]>([]);
	let isLoadingScopes = $state(false);
	let scopeLoadError = $state<string | null>(null);

	let allScopes = $state<{ id: string; name: string; description: string }[]>([]);

	$effect(() => {
		if (availableScopes && availableScopes.length > 0) {
			allScopes = availableScopes;
		} else {
			allScopes = serverScopes;
		}
	});

	async function loadScopes() {
		if (availableScopes && availableScopes.length > 0) {
			return;
		}

		try {
			isLoadingScopes = true;
			scopeLoadError = null;

			const { apiClient } = await import('$lib');
			const scopes = await apiClient.getAvailableScopes();

			serverScopes = scopes.map((scope: any) => ({
				id: scope.id,
				name: scope.name || scope.id,
				description: scope.description || `${scope.id} 권한`
			}));
		} catch (error) {
			console.error('스코프 목록 로드 실패:', error);
			scopeLoadError = '스코프 목록을 불러오는데 실패했습니다.';
			serverScopes = [...DEFAULT_SCOPES];
		} finally {
			isLoadingScopes = false;
		}
	}

	onMount(() => {
		loadScopes();
	});

	function isScopeSelected(scopeId: string): boolean {
		return selectedScopes.includes(scopeId);
	}

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
							class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700"
						>
							{scope.name}
							<button
								type="button"
								onclick={() => handleScopeToggle(scopeId)}
								{disabled}
								class="ml-1 text-stone-500 hover:text-stone-700"
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
						class="flex items-center space-x-3 rounded-lg border p-3 text-left transition-all hover:bg-gray-50 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none {isSelected
							? 'border-stone-300 bg-stone-50'
							: 'border-gray-200'}"
					>
						<div class="shrink-0">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-stone-500 to-stone-600"
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
								<FontAwesomeIcon icon={faCheck} class="text-stone-600" />
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
