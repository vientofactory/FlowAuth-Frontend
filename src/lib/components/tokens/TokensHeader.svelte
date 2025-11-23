<script lang="ts">
	import { Button, Tabs } from '$lib';
	import { TOKEN_TYPES, type TokenType } from '$lib/types/authorization.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faTrash } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		activeTab: TokenType;
		tokensCount: { login: number; oauth2: number };
		onTabChange: (tabId: string) => void;
		onRevokeAll: (tokenType: TokenType) => void;
	}

	let { activeTab, tokensCount, onTabChange, onRevokeAll }: Props = $props();

	let tabs = [
		{
			id: TOKEN_TYPES.LOGIN,
			label: `로그인 토큰 (${tokensCount.login})`
		},
		{
			id: TOKEN_TYPES.OAUTH2,
			label: `OAuth2 토큰 (${tokensCount.oauth2})`
		}
	];
</script>

<div class="mb-6">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold text-gray-900">토큰 관리</h2>
			<p class="mt-1 text-sm text-gray-500">
				발급된 토큰들을 관리하고 필요에 따라 폐기할 수 있습니다.
			</p>
		</div>

		<div class="flex gap-2">
			{#if activeTab === TOKEN_TYPES.LOGIN && tokensCount.login > 0}
				<Button
					variant="outline"
					onclick={() => onRevokeAll(TOKEN_TYPES.LOGIN)}
					class="border-red-300 text-red-600 hover:bg-red-50"
				>
					<FontAwesomeIcon icon={faTrash} class="mr-2" />
					모든 로그인 토큰 폐기
				</Button>
			{/if}

			{#if activeTab === TOKEN_TYPES.OAUTH2 && tokensCount.oauth2 > 0}
				<Button
					variant="outline"
					onclick={() => onRevokeAll(TOKEN_TYPES.OAUTH2)}
					class="border-red-300 text-red-600 hover:bg-red-50"
				>
					<FontAwesomeIcon icon={faTrash} class="mr-2" />
					모든 OAuth2 토큰 폐기
				</Button>
			{/if}
		</div>
	</div>

	<Tabs {tabs} {activeTab} {onTabChange} />
</div>
