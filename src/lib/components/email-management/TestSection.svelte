<script lang="ts">
	interface Props {
		onSendTest: () => void;
	}

	let { onSendTest }: Props = $props();
</script>

<div class="space-y-6">
	<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
		<div class="flex items-center gap-2">
			<i class="fas fa-exclamation-triangle text-yellow-600"></i>
			<p class="text-sm text-yellow-800">
				테스트 이메일은 실제 사용자에게 전송됩니다. 테스트용 이메일 주소를 사용하세요.
			</p>
		</div>
	</div>

	<button
		onclick={onSendTest}
		class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
	>
		<i class="fas fa-envelope"></i>
		테스트 이메일 전송
	</button>
</div>
