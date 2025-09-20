<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';

	interface Props {
		backupCodes: string[];
		onComplete: () => void;
	}

	let { backupCodes, onComplete }: Props = $props();

	let downloaded = $state(false);

	function downloadBackupCodes() {
		const content = [
			'FlowAuth 백업 코드',
			'생성일: ' + new Date().toLocaleDateString('ko-KR'),
			'',
			'⚠️ 중요: 이 코드들을 안전한 곳에 보관하세요.',
			'- 각 코드는 한 번만 사용할 수 있습니다.',
			'- 인증 앱을 사용할 수 없을 때 로그인에 사용됩니다.',
			'- 이 코드를 분실하면 계정 복구가 어려울 수 있습니다.',
			'',
			'백업 코드:',
			...backupCodes.map((code, index) => `${index + 1}. ${code}`)
		].join('\n');

		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `flowauth-backup-codes-${Date.now()}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		downloaded = true;
	}

	async function copyToClipboard() {
		const text = backupCodes.join('\n');
		try {
			await navigator.clipboard.writeText(text);
			// 여기서 토스트 메시지를 표시할 수 있음
		} catch (err) {
			console.error('클립보드 복사 실패:', err);
		}
	}
</script>

<Card>
	<div class="p-6">
		<div class="text-center">
			<div
				class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100"
			>
				<i class="fas fa-shield-alt text-xl text-yellow-600"></i>
			</div>
			<h2 class="mb-2 text-xl font-bold text-gray-900">3단계: 백업 코드 저장</h2>
			<p class="mb-6 text-gray-600">인증 앱을 사용할 수 없을 때를 위한 백업 코드입니다.</p>
		</div>

		<!-- 경고 메시지 -->
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex items-start">
				<i class="fas fa-exclamation-triangle mt-0.5 text-red-500"></i>
				<div class="ml-3">
					<h3 class="font-semibold text-red-800">중요한 보안 사항</h3>
					<ul class="mt-2 space-y-1 text-sm text-red-700">
						<li>• 각 백업 코드는 한 번만 사용할 수 있습니다</li>
						<li>• 안전한 곳에 보관하고 다른 사람과 공유하지 마세요</li>
						<li>• 백업 코드를 분실하면 계정 복구가 어려울 수 있습니다</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- 백업 코드 목록 -->
		<div class="mb-6 rounded-lg bg-gray-100 p-4">
			<h3 class="mb-3 font-semibold text-gray-900">백업 코드</h3>
			<div class="grid grid-cols-2 gap-2 font-mono text-sm">
				{#each backupCodes as code, index (index)}
					<div class="rounded bg-white p-2 text-center font-semibold">
						{code}
					</div>
				{/each}
			</div>
		</div>

		<!-- 액션 버튼들 -->
		<div class="mb-6 flex flex-col gap-3 sm:flex-row">
			<Button variant="outline" onclick={downloadBackupCodes} class="flex-1">
				<i class="fas fa-download mr-2"></i>
				텍스트 파일로 다운로드
			</Button>
			<Button variant="outline" onclick={copyToClipboard} class="flex-1">
				<i class="fas fa-copy mr-2"></i>
				클립보드에 복사
			</Button>
		</div>

		<!-- 확인 체크박스 -->
		<div class="mb-6">
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={downloaded}
					class="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm text-gray-700"> 백업 코드를 안전한 곳에 저장했습니다. </span>
			</label>
		</div>

		<div class="flex justify-center">
			<Button onclick={onComplete} disabled={!downloaded} class="min-w-32">
				<i class="fas fa-check mr-2"></i>
				완료
			</Button>
		</div>
	</div>
</Card>
