<script lang="ts">
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faServer,
		faSyncAlt,
		faKey,
		faShieldAlt,
		faInfoCircle
	} from '@fortawesome/free-solid-svg-icons';

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

<div
	class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
>
	<div class="relative">
		<div class="flex items-center justify-between">
			<h3 class="flex items-center text-lg font-semibold text-gray-900">
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faServer} class="text-stone-600" />
				</div>
				SMTP 연결 상태
			</h3>
			<Button
				variant="outline"
				onclick={onRefresh}
				disabled={isRefreshing}
				class="transition-colors hover:border-stone-200 hover:bg-stone-50"
			>
				<FontAwesomeIcon icon={faSyncAlt} class="mr-2 {isRefreshing ? 'animate-spin' : ''}" />
				새로고침
			</Button>
		</div>

		{#if smtpStatus}
			<div class="mt-6 space-y-4">
				<!-- 연결 상태 표시 -->
				<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg {smtpStatus.connected
							? 'bg-green-100'
							: 'bg-red-100'}"
					>
						<div
							class="h-3 w-3 rounded-full {smtpStatus.connected ? 'bg-green-500' : 'bg-red-500'}"
						></div>
					</div>
					<div class="flex-1">
						<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">연결 상태</p>
						<p class="font-medium {smtpStatus.connected ? 'text-green-700' : 'text-red-700'}">
							{smtpStatus.connected ? '연결됨' : '연결 실패'}
						</p>
						{#if smtpStatus.lastChecked}
							<p class="text-xs text-gray-500">
								마지막 확인: {formatLastChecked(smtpStatus.lastChecked)}
							</p>
						{/if}
					</div>
				</div>

				<!-- 서버 정보 -->
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
							<FontAwesomeIcon icon={faServer} class="text-neutral-600" />
						</div>
						<div>
							<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">서버</p>
							<p class="font-medium text-gray-900">{smtpStatus.host}:{smtpStatus.port}</p>
						</div>
					</div>

					<div class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
							<FontAwesomeIcon icon={faKey} class="text-gray-600" />
						</div>
						<div>
							<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">인증</p>
							<p class="font-medium text-gray-900">{smtpStatus.auth || '없음'}</p>
						</div>
					</div>

					<div
						class="flex items-center space-x-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1"
					>
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
							<FontAwesomeIcon icon={faShieldAlt} class="text-slate-600" />
						</div>
						<div>
							<p class="text-xs font-medium tracking-wide text-gray-500 uppercase">보안</p>
							<p class="font-medium text-gray-900">
								{smtpStatus.secure ? 'SSL/TLS' : '비보안'}
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="mt-6 rounded-lg bg-white/60 p-6 text-center backdrop-blur-sm">
				<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
					<FontAwesomeIcon icon={faInfoCircle} class="text-2xl text-gray-400" />
				</div>
				<p class="text-gray-500">SMTP 상태를 확인하려면 새로고침을 클릭하세요.</p>
			</div>
		{/if}
	</div>
</div>
