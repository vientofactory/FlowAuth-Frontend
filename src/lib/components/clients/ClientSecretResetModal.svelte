<script lang="ts">
	import { Modal, Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faExclamationTriangle,
		faExclamationCircle,
		faInfoCircle,
		faSpinner,
		faSyncAlt,
		faCheckCircle,
		faShieldAlt,
		faCopy
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		show: boolean;
		clientName: string;
		isLoading: boolean;
		newSecret?: string;
		onConfirm: () => void;
		onClose: () => void;
		onCopyToClipboard: (text: string) => void;
	}

	let { show, clientName, isLoading, newSecret, onConfirm, onClose, onCopyToClipboard }: Props =
		$props();
</script>

<Modal open={show} title="클라이언트 시크릿 재설정" {onClose}>
	<div class="space-y-4">
		{#if !newSecret}
			<div class="space-y-4">
				<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<FontAwesomeIcon icon={faExclamationTriangle} class="text-yellow-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">클라이언트 시크릿 재설정 경고</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p><strong>{clientName}</strong>의 클라이언트 시크릿을 재설정하시겠습니까?</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-md border border-red-200 bg-red-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<FontAwesomeIcon icon={faExclamationCircle} class="text-red-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">중요: 기존 시크릿 무효화</h3>
							<div class="mt-2 text-sm text-red-700">
								<ul class="list-inside list-disc space-y-1">
									<li><strong>기존 클라이언트 시크릿이 즉시 무효화됩니다</strong></li>
									<li>현재 이 시크릿을 사용하는 모든 애플리케이션이 작동하지 않게 됩니다</li>
									<li>새로운 시크릿으로 애플리케이션을 업데이트해야 합니다</li>
									<li>이 작업은 되돌릴 수 없습니다</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-md border border-stone-200 bg-stone-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<FontAwesomeIcon icon={faInfoCircle} class="text-stone-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-stone-800">재설정 후 해야 할 일</h3>
							<div class="mt-2 text-sm text-stone-700">
								<ul class="list-inside list-disc space-y-1">
									<li>새로운 클라이언트 시크릿을 안전한 곳에 저장하세요</li>
									<li>모든 애플리케이션에서 새 시크릿으로 업데이트하세요</li>
									<li>업데이트가 완료된 후 애플리케이션이 정상 작동하는지 확인하세요</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-end space-x-3 pt-4">
				<Button variant="outline" onclick={onClose} disabled={isLoading}>취소</Button>
				<Button
					onclick={onConfirm}
					disabled={isLoading}
					class="bg-red-600 hover:bg-red-700 focus:ring-red-500"
				>
					{#if isLoading}
						<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
						재설정 중...
					{:else}
						<FontAwesomeIcon icon={faSyncAlt} class="mr-2" />
						네, 시크릿을 재설정합니다
					{/if}
				</Button>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="rounded-md border border-green-200 bg-green-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<FontAwesomeIcon icon={faCheckCircle} class="text-green-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-green-800">클라이언트 시크릿 재설정 완료</h3>
							<div class="mt-2 text-sm text-green-700">
								<p>
									<strong>{clientName}</strong>의 클라이언트 시크릿이 성공적으로 재설정되었습니다.
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-md border border-orange-200 bg-orange-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<FontAwesomeIcon icon={faShieldAlt} class="text-orange-400" />
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-orange-800">보안 알림</h3>
							<div class="mt-2 text-sm text-orange-700">
								<p>
									새로운 시크릿을 안전하게 저장하세요. <strong
										>이 시크릿은 다시 확인할 수 없습니다.</strong
									>
								</p>
							</div>
						</div>
					</div>
				</div>

				<div>
					<label for="newClientSecret" class="mb-2 block text-sm font-medium text-gray-700">
						새 Client Secret
					</label>
					<div class="flex space-x-2">
						<input
							id="newClientSecret"
							type="text"
							value={newSecret}
							readonly
							class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
						/>
						<Button
							onclick={() => onCopyToClipboard(newSecret)}
							variant="outline"
							size="sm"
							class="px-4"
						>
							<FontAwesomeIcon icon={faCopy} class="mr-1" />
							복사
						</Button>
					</div>
				</div>
			</div>
			<div class="flex justify-end">
				<Button onclick={onClose}>확인</Button>
			</div>
		{/if}
	</div>
</Modal>
