<script lang="ts">
	import { Modal } from '$lib';
	import TokenInfoTab from './TokenInfoTab.svelte';
	import ProfileInfoTab from './ProfileInfoTab.svelte';
	import TokenAnalysisTab from './TokenAnalysisTab.svelte';

	interface TokenResponse {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
		id_token?: string;
	}

	interface UserProfile {
		sub: string;
		email?: string;
		username?: string;
		roles?: string[];
	}

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
		showTokenModal: boolean;
		tokenResponse: TokenResponse | null;
		implicitTokens: TokenResponse | null;
		activeTab: string;
		userProfile: UserProfile | null;
		tokenInfo: TokenInfo | null;
		idTokenInfo: TokenInfo | null;
		tokenAnalysisType: 'access' | 'id';
		isTestingToken: boolean;
		onCloseModal: () => void;
		onSetActiveTab: (tab: string) => void;
		onSetAnalysisType: (type: 'access' | 'id') => void;
		onCopyToClipboard: (text: string) => void;
		onFetchUserProfile: () => void;
		onAnalyzeToken: () => void;
		onAnalyzeIdToken: () => void;
		formatJwtToken: (token: string) => {
			isValid: boolean;
			header: string;
			payload: string;
			signature: string;
			fullToken: string;
		};
	}

	let {
		showTokenModal,
		tokenResponse,
		implicitTokens,
		activeTab,
		userProfile,
		tokenInfo,
		idTokenInfo,
		tokenAnalysisType,
		isTestingToken,
		onCloseModal,
		onSetActiveTab,
		onSetAnalysisType,
		onCopyToClipboard,
		onFetchUserProfile,
		onAnalyzeToken,
		onAnalyzeIdToken,
		formatJwtToken
	}: Props = $props();
</script>

{#snippet tokenModalChildren()}
	{#if tokenResponse}
		<div class="space-y-6">
			<!-- 성공 메시지 -->
			<div class="rounded-lg border border-green-200 bg-green-50 p-4">
				<div class="flex items-center">
					<i class="fas fa-check-circle mr-2 text-green-600"></i>
					<span class="font-medium text-green-800">토큰 교환 성공</span>
				</div>
			</div>

			<!-- 탭 메뉴 -->
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						onclick={() => onSetActiveTab('token')}
						class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'token'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					>
						토큰 정보
					</button>
					<button
						onclick={() => onSetActiveTab('profile')}
						class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'profile'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					>
						프로필 정보
					</button>
					<button
						onclick={() => onSetActiveTab('test')}
						class="border-b-2 px-1 py-2 text-sm font-medium transition-colors
							{activeTab === 'test'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					>
						토큰 분석
					</button>
				</nav>
			</div>

			<!-- 탭 콘텐츠 -->
			{#if activeTab === 'token'}
				<TokenInfoTab
					{tokenResponse}
					{implicitTokens}
					{isTestingToken}
					{onCopyToClipboard}
					{onFetchUserProfile}
					{onAnalyzeToken}
					{onAnalyzeIdToken}
					{formatJwtToken}
				/>
			{:else if activeTab === 'profile'}
				<ProfileInfoTab {userProfile} {isTestingToken} {onFetchUserProfile} />
			{:else if activeTab === 'test'}
				<TokenAnalysisTab
					{tokenInfo}
					{idTokenInfo}
					{tokenAnalysisType}
					{tokenResponse}
					{onSetAnalysisType}
					{onAnalyzeToken}
					{onAnalyzeIdToken}
				/>
			{/if}

			<!-- 하단 안내 -->
			<div class="border-t border-gray-200 pt-4 text-xs text-gray-500">
				<p><strong>참고:</strong> 이 토큰들은 API 요청에 사용할 수 있습니다.</p>
				<p>액세스 토큰은 Authorization 헤더에 "Bearer &lt;token&gt;" 형식으로 포함시키세요.</p>
			</div>
		</div>
	{/if}
{/snippet}

<Modal
	open={showTokenModal && !!tokenResponse}
	title="OAuth2 토큰 테스트"
	onClose={onCloseModal}
	size="xl"
	children={tokenModalChildren}
></Modal>
