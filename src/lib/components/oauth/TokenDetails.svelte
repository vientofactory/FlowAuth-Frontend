<script lang="ts">
	import { Card } from '$lib';
	import { formatJWTPayload, formatJWTHeader, type TokenInfo } from '$lib/utils/jwt-utils';

	interface Props {
		title: string;
		tokenInfo: TokenInfo;
		tokenString: string;
	}

	let { title, tokenInfo, tokenString }: Props = $props();

	// 토큰 복사 함수
	async function copyToken() {
		try {
			await navigator.clipboard.writeText(tokenString);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = tokenString;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
		}
	}
</script>

<div class="space-y-4">
	<Card>
		<div class="p-4">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="font-medium text-gray-900">{title} 헤더</h3>
				<button
					onclick={copyToken}
					class="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
				>
					복사
				</button>
			</div>
			<pre class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
				{formatJWTHeader(tokenInfo.header)}
			</pre>
		</div>
	</Card>

	<Card>
		<div class="p-4">
			<h3 class="mb-3 font-medium text-gray-900">{title} 페이로드</h3>
			<pre class="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800">
				{formatJWTPayload(tokenInfo.payload)}
			</pre>
		</div>
	</Card>

	<Card>
		<div class="p-4">
			<h3 class="mb-3 font-medium text-gray-900">{title} 서명</h3>
			<div class="rounded bg-gray-50 p-3 font-mono text-xs break-all text-gray-800">
				{tokenInfo.signature}
			</div>
		</div>
	</Card>
</div>
