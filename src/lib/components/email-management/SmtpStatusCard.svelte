<script lang="ts">
	interface SmtpStatus {
		connected: boolean;
		host: string;
		port: number;
		auth: string;
		secure: boolean;
		lastChecked: string;
	}

	interface Props {
		smtpStatus: SmtpStatus | null;
		onRefresh: () => void;
		isRefreshing: boolean;
	}

	let { smtpStatus, onRefresh, isRefreshing }: Props = $props();

	function formatLastChecked(lastChecked: string) {
		return new Date(lastChecked).toLocaleString('ko-KR');
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900">SMTP 연결 상태</h3>
		<button
			onclick={onRefresh}
			disabled={isRefreshing}
			class="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
		>
			<i class="fas fa-sync-alt {isRefreshing ? 'animate-spin' : ''}"></i>
			새로고침
		</button>
	</div>

	{#if smtpStatus}
		<div class="mt-4 space-y-3">
			<!-- 연결 상태 -->
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full {smtpStatus.connected ? 'bg-green-500' : 'bg-red-500'}"
					></div>
					<span class="font-medium {smtpStatus.connected ? 'text-green-700' : 'text-red-700'}">
						{smtpStatus.connected ? '연결됨' : '연결 실패'}
					</span>
				</div>
				{#if smtpStatus.lastChecked}
					<span class="text-sm text-gray-500">
						마지막 확인: {formatLastChecked(smtpStatus.lastChecked)}
					</span>
				{/if}
			</div>

			<!-- 서버 정보 -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<div>
						<span class="text-sm font-medium text-gray-500">서버</span>
						<p class="text-gray-900">{smtpStatus.host}:{smtpStatus.port}</p>
					</div>
					<div>
						<span class="text-sm font-medium text-gray-500">인증</span>
						<p class="text-gray-900">{smtpStatus.auth || '없음'}</p>
					</div>
				</div>
				<div class="space-y-2">
					<div>
						<span class="text-sm font-medium text-gray-500">보안</span>
						<p class="text-gray-900">
							{smtpStatus.secure ? 'SSL/TLS' : '비보안'}
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mt-4 rounded-lg bg-gray-50 p-4 text-center">
			<i class="fas fa-info-circle mb-2 text-2xl text-gray-400"></i>
			<p class="text-gray-500">SMTP 상태를 확인하려면 새로고침을 클릭하세요.</p>
		</div>
	{/if}
</div>
