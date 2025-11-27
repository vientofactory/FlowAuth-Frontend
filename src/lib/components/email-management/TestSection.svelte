<script lang="ts">
	import { Button } from '$lib';
	import Alert from '$lib/components/Alert.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		onSendTest: () => void;
	}

	let { onSendTest }: Props = $props();
</script>

<div
	class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
>
	<div class="relative">
		<div class="mb-6 text-center sm:text-left">
			<h3
				class="mb-2 flex items-center justify-center text-lg font-semibold text-gray-900 sm:justify-start"
			>
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faEnvelope} class="text-stone-600" />
				</div>
				이메일 테스트
			</h3>
			<p class="text-sm text-gray-600">SMTP 연결과 이메일 전송 기능을 테스트하세요</p>
		</div>

		<div class="space-y-4">
			<!-- 주의사항 -->
			<Alert variant="warning" title="테스트 주의사항">
				테스트 이메일은 실제 사용자에게 전송됩니다. 테스트용 이메일 주소를 사용하세요.
			</Alert>

			<!-- 테스트 버튼 -->
			<div class="flex justify-center sm:justify-start">
				<Button
					variant="primary"
					onclick={onSendTest}
					class="w-full bg-stone-600 hover:bg-stone-700 sm:w-auto"
				>
					<FontAwesomeIcon icon={faEnvelope} class="mr-2" />
					테스트 이메일 전송
				</Button>
			</div>
		</div>
	</div>
</div>
