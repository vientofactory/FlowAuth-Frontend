<script lang="ts">
	import { Modal, Button } from '$lib';
	import type { Client } from '$lib/types/oauth.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faPauseCircle,
		faPlayCircle,
		faExclamationTriangle,
		faCheckCircle,
		faSpinner,
		faPause,
		faPlay
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		show: boolean;
		client: Client | null;
		isLoading: boolean;
		onConfirm: () => void;
		onClose: () => void;
	}

	let { show, client, isLoading, onConfirm, onClose }: Props = $props();

	const actionText = $derived(client?.isActive ? '비활성화' : '활성화');
	const actionColor = $derived(client?.isActive ? 'red' : 'green');
</script>

<Modal open={show && !!client} title="클라이언트 상태 변경" {onClose}>
	<div class="space-y-4">
		{#if client}
			<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
				<div class="flex">
					<div class="shrink-0">
						<FontAwesomeIcon
							icon={client.isActive ? faPauseCircle : faPlayCircle}
							class="text-gray-400"
						/>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-gray-800">
							클라이언트 {actionText} 확인
						</h3>
						<div class="mt-2 text-sm text-gray-700">
							<p><strong>{client.name}</strong> 클라이언트를 {actionText}하시겠습니까?</p>
						</div>
					</div>
				</div>
			</div>

			{#if client.isActive}
				<!-- 비활성화 경고 -->
				<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
					<div class="flex">
						<div class="shrink-0">
							<FontAwesomeIcon icon={faExclamationTriangle} class="text-yellow-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">비활성화 시 영향</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<ul class="list-inside list-disc space-y-1">
									<li>이 클라이언트를 사용하는 모든 OAuth2 인증이 차단됩니다</li>
									<li>기존에 발급된 토큰은 계속 유효하지만 새로운 토큰 발급이 중지됩니다</li>
									<li>사용자들이 이 애플리케이션으로 로그인할 수 없게 됩니다</li>
									<li>언제든지 다시 활성화할 수 있습니다</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- 활성화 정보 -->
				<div class="rounded-md border border-green-200 bg-green-50 p-4">
					<div class="flex">
						<div class="shrink-0">
							<FontAwesomeIcon icon={faCheckCircle} class="text-green-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">활성화 시 효과</h3>
							<div class="mt-2 text-sm text-green-700">
								<ul class="list-inside list-disc space-y-1">
									<li>OAuth2 인증 플로우가 정상적으로 작동합니다</li>
									<li>사용자들이 이 애플리케이션으로 로그인할 수 있습니다</li>
									<li>새로운 액세스 토큰 발급이 가능합니다</li>
									<li>모든 OAuth2 기능이 활성화됩니다</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	{#snippet footer()}
		{#if client}
			<Button variant="outline" onclick={onClose} disabled={isLoading}>취소</Button>
			<Button
				onclick={onConfirm}
				disabled={isLoading}
				class={actionColor === 'red'
					? 'bg-red-600 hover:bg-red-700'
					: 'bg-green-600 hover:bg-green-700'}
			>
				{#if isLoading}
					<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
					{actionText} 중...
				{:else}
					<FontAwesomeIcon icon={client.isActive ? faPause : faPlay} class="mr-2" />
					{actionText}
				{/if}
			</Button>
		{/if}
	{/snippet}
</Modal>
