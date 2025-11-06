<script lang="ts">
	import { Button } from '$lib';

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
					<i class="fas fa-envelope text-stone-600"></i>
				</div>
				이메일 테스트
			</h3>
			<p class="text-sm text-gray-600">SMTP 연결과 이메일 전송 기능을 테스트하세요</p>
		</div>

		<div class="space-y-4">
			<!-- 주의사항 -->
			<div class="rounded-lg border border-yellow-200 bg-yellow-50/80 p-4 backdrop-blur-sm">
				<div class="flex items-start gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
						<i class="fas fa-exclamation-triangle text-yellow-600"></i>
					</div>
					<div class="flex-1">
						<p class="mb-1 text-sm font-medium text-yellow-800">테스트 주의사항</p>
						<p class="text-sm text-yellow-700">
							테스트 이메일은 실제 사용자에게 전송됩니다. 테스트용 이메일 주소를 사용하세요.
						</p>
					</div>
				</div>
			</div>

			<!-- 테스트 버튼 -->
			<div class="flex justify-center sm:justify-start">
				<Button
					variant="primary"
					onclick={onSendTest}
					class="w-full bg-stone-600 hover:bg-stone-700 sm:w-auto"
				>
					<i class="fas fa-envelope mr-2"></i>
					테스트 이메일 전송
				</Button>
			</div>
		</div>
	</div>
</div>
