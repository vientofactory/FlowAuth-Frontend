<!-- 에러 처리 데모 페이지 (개발용) -->
<script lang="ts">
	import { Button, Card, errorManager } from '$lib';
	import { goto } from '$app/navigation';

	// 다양한 에러 상황 시뮬레이션
	function simulateNetworkError() {
		errorManager.showNetworkError();
	}

	function simulateAuthError() {
		errorManager.showAuthError();
	}

	function simulatePermissionError() {
		errorManager.showPermissionError();
	}

	function simulateValidationError() {
		errorManager.showValidationError('이메일 형식이 올바르지 않습니다.');
	}

	function simulateServerError() {
		errorManager.showError('내부 서버 오류가 발생했습니다.', 500);
	}

	function simulate404Error() {
		// 실제 404 페이지로 이동
		goto('/nonexistent-page');
	}

	function clearAllErrors() {
		errorManager.clearAll();
	}

	// 실제 API 에러 시뮬레이션
	async function simulateApiError() {
		try {
			const response = await fetch('/api/nonexistent-endpoint');
			if (!response.ok) {
				await errorManager.handleFetchError(response);
			}
		} catch (error) {
			if (error instanceof Error) {
				errorManager.handleJavaScriptError(error);
			}
		}
	}
</script>

<svelte:head>
	<title>에러 처리 데모 - FlowAuth</title>
</svelte:head>

<div class="container mx-auto max-w-4xl p-6">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl font-bold text-gray-900">에러 처리 시스템 데모</h1>
		<p class="text-lg text-gray-600">
			다양한 에러 상황을 시뮬레이션하여 사용자 친화적인 에러 처리를 테스트할 수 있습니다.
		</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- 클라이언트 에러 -->
		<Card>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">클라이언트 에러 (4xx)</h2>
			<div class="space-y-3">
				<Button onclick={simulateAuthError} variant="outline" class="w-full">
					<i class="fas fa-lock mr-2"></i>
					인증 오류 (401)
				</Button>
				<Button onclick={simulatePermissionError} variant="outline" class="w-full">
					<i class="fas fa-ban mr-2"></i>
					권한 오류 (403)
				</Button>
				<Button onclick={simulate404Error} variant="outline" class="w-full">
					<i class="fas fa-search mr-2"></i>
					페이지 없음 (404)
				</Button>
				<Button onclick={simulateValidationError} variant="outline" class="w-full">
					<i class="fas fa-exclamation-circle mr-2"></i>
					검증 오류 (422)
				</Button>
			</div>
		</Card>

		<!-- 서버 에러 -->
		<Card>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">서버 에러 (5xx)</h2>
			<div class="space-y-3">
				<Button onclick={simulateServerError} variant="outline" class="w-full">
					<i class="fas fa-server mr-2"></i>
					서버 오류 (500)
				</Button>
				<Button onclick={simulateApiError} variant="outline" class="w-full">
					<i class="fas fa-code mr-2"></i>
					실제 API 오류
				</Button>
			</div>
		</Card>

		<!-- 네트워크 에러 -->
		<Card>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">네트워크 에러</h2>
			<div class="space-y-3">
				<Button onclick={simulateNetworkError} variant="outline" class="w-full">
					<i class="fas fa-wifi-slash mr-2"></i>
					네트워크 연결 오류
				</Button>
			</div>
		</Card>

		<!-- 에러 관리 -->
		<Card>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">에러 관리</h2>
			<div class="space-y-3">
				<Button onclick={clearAllErrors} variant="danger" class="w-full">
					<i class="fas fa-trash mr-2"></i>
					모든 에러 토스트 제거
				</Button>
				<Button onclick={() => goto('/')} variant="primary" class="w-full">
					<i class="fas fa-home mr-2"></i>
					홈으로 돌아가기
				</Button>
			</div>
		</Card>
	</div>

	<!-- 사용법 안내 -->
	<Card class="mt-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">에러 처리 시스템 특징</h2>
		<div class="grid gap-4 md:grid-cols-2">
			<div>
				<h3 class="mb-2 font-medium text-gray-900">자동 분류</h3>
				<ul class="space-y-1 text-sm text-gray-600">
					<li>• 네트워크, 인증, 권한, 검증, 서버 에러로 자동 분류</li>
					<li>• 에러 타입에 따른 적절한 아이콘과 색상 표시</li>
					<li>• 사용자 친화적인 메시지로 자동 변환</li>
				</ul>
			</div>
			<div>
				<h3 class="mb-2 font-medium text-gray-900">스마트 액션</h3>
				<ul class="space-y-1 text-sm text-gray-600">
					<li>• 에러 타입에 따른 권장 액션 자동 제공</li>
					<li>• 인증 에러 시 자동 로그인 페이지 이동</li>
					<li>• 네트워크 에러 시 재시도 옵션 제공</li>
				</ul>
			</div>
		</div>
	</Card>
</div>
