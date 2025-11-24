<script lang="ts">
	import { Button, Badge } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';

	interface TokenInfo {
		header: {
			alg: string;
			typ: string;
			[key: string]: unknown;
		};
		payload: Record<string, unknown>;
		signature: string;
		issuedAt: Date | null;
		expiresAt: Date | null;
		isExpired: boolean;
	}

	interface Props {
		tokenInfo: TokenInfo | null;
		idTokenInfo: TokenInfo | null;
		tokenAnalysisType: 'access' | 'id';
		tokenResponse: { access_token?: string; id_token?: string } | null;
		onSetAnalysisType: (type: 'access' | 'id') => void;
		onAnalyzeToken: () => void;
		onAnalyzeIdToken: () => void;
	}

	let {
		tokenInfo,
		idTokenInfo,
		tokenAnalysisType,
		tokenResponse,
		onSetAnalysisType,
		onAnalyzeToken,
		onAnalyzeIdToken
	}: Props = $props();

	let currentTokenInfo = $derived(tokenAnalysisType === 'access' ? tokenInfo : idTokenInfo);
</script>

<div class="space-y-4">
	<!-- 토큰 타입 선택 -->
	<div class="flex space-x-2 border-b border-gray-200 pb-4">
		<Button
			variant={tokenAnalysisType === 'access' ? 'primary' : 'outline'}
			size="sm"
			onclick={() => {
				onSetAnalysisType('access');
				if (tokenResponse?.access_token && !tokenInfo) {
					onAnalyzeToken();
				}
			}}
			disabled={!tokenResponse?.access_token}
		>
			액세스 토큰
		</Button>
		<Button
			variant={tokenAnalysisType === 'id' ? 'primary' : 'outline'}
			size="sm"
			onclick={() => {
				onSetAnalysisType('id');
				if (tokenResponse?.id_token && !idTokenInfo) {
					onAnalyzeIdToken();
				}
			}}
			disabled={!tokenResponse?.id_token}
		>
			ID 토큰
		</Button>
	</div>

	<!-- 선택된 토큰 분석 결과 -->
	{#if currentTokenInfo}
		<div class="space-y-4">
			<!-- 토큰 상태 -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">상태</div>
					<div class="text-sm">
						{#if currentTokenInfo.isExpired}
							<Badge variant="error">만료됨</Badge>
						{:else}
							<Badge variant="success">유효함</Badge>
						{/if}
					</div>
				</div>
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">토큰 타입</div>
					<div class="text-sm text-gray-900">{currentTokenInfo.header.typ}</div>
				</div>
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">알고리즘</div>
					<div class="text-sm text-gray-900">{currentTokenInfo.header.alg}</div>
				</div>
				<div>
					<div class="mb-1 text-sm font-medium text-gray-700">제목</div>
					<div class="text-sm text-gray-900">
						{tokenAnalysisType === 'access' ? '액세스 토큰' : 'ID 토큰'}
					</div>
				</div>
			</div>

			<!-- 시간 정보 -->
			{#if currentTokenInfo.issuedAt || currentTokenInfo.expiresAt}
				<div class="grid grid-cols-1 gap-4">
					{#if currentTokenInfo.issuedAt}
						<div>
							<div class="mb-1 text-sm font-medium text-gray-700">발급 시간</div>
							<div class="text-sm text-gray-900">
								{currentTokenInfo.issuedAt.toLocaleString()}
							</div>
						</div>
					{/if}
					{#if currentTokenInfo.expiresAt}
						<div>
							<div class="mb-1 text-sm font-medium text-gray-700">만료 시간</div>
							<div class="text-sm text-gray-900">
								{currentTokenInfo.expiresAt.toLocaleString()}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- 페이로드 정보 -->
			<div>
				<div class="mb-2 text-sm font-medium text-gray-700">페이로드</div>
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<pre class="text-xs text-gray-800">{JSON.stringify(
							currentTokenInfo.payload,
							null,
							2
						)}</pre>
				</div>
			</div>

			<!-- 헤더 정보 -->
			<div>
				<div class="mb-2 text-sm font-medium text-gray-700">헤더</div>
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<pre class="text-xs text-gray-800">{JSON.stringify(
							currentTokenInfo.header,
							null,
							2
						)}</pre>
				</div>
			</div>
		</div>
	{:else}
		<div class="py-8 text-center">
			<FontAwesomeIcon icon={faSearch} class="mb-4 text-4xl text-gray-400" />
			<p class="mb-4 text-gray-500">
				{tokenAnalysisType === 'access' ? '액세스 토큰' : 'ID 토큰'}을 분석하려면 위의 버튼을
				클릭하세요.
			</p>
			<Button onclick={tokenAnalysisType === 'access' ? onAnalyzeToken : onAnalyzeIdToken}>
				<FontAwesomeIcon icon={faSearch} class="mr-2" />
				{tokenAnalysisType === 'access' ? '액세스 토큰' : 'ID 토큰'} 분석
			</Button>
		</div>
	{/if}
</div>
