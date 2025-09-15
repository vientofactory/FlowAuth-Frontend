<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import LoadingState from '$lib/components/oauth2/LoadingState.svelte';
	import ErrorState from '$lib/components/oauth2/ErrorState.svelte';
	import { useAuthorization } from '$lib/hooks/useAuthorization';
	import type { AuthorizationState } from '$lib/types/authorization.types';
	import type { PageData } from './$types';

	export let data: PageData;

	// 권한 부여 훅 사용
	const { state, handleConsent, retryAuthorization, loadAuthorizationData } = useAuthorization(data);

	// 상태 구독
	let currentState: AuthorizationState;
	const unsubscribe = state.subscribe((value) => {
		currentState = value;
	});

	onMount(() => {
		console.log('[Page] Component mounted, starting authorization data load');
		loadAuthorizationData();

		// 추가 안전장치: 45초 후에도 로딩 중이면 강제로 에러 상태로 전환
		setTimeout(() => {
			state.update((current) => {
				if (current.loading) {
					console.error('[Page] Force timeout: loading took too long');
					return {
						...current,
						loading: false,
						error: {
							type: ErrorType.TIMEOUT_ERROR,
							message: '보안 검증이 예상보다 오래 걸리고 있습니다. 페이지를 새로고침해주세요.',
							retryable: false
						}
					};
				}
				return current;
			});
		}, 45000);

		return unsubscribe;
	});

	// 이벤트 핸들러
	function handleApprove() {
		handleConsent(true);
	}

	function handleDeny() {
		handleConsent(false);
	}

	function handleRetry() {
		retryAuthorization();
	}

	function handleGoBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4"
	role="main"
	aria-labelledby="authorize-heading"
>
	<div class="w-full max-w-md">
		{#if currentState?.loading}
			<Card class="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
				<LoadingState
					message={currentState.loadingProgress < 50 ? "보안 검증을 준비하고 있습니다..." : currentState.loadingProgress < 80 ? "클라이언트 정보를 확인하고 있습니다..." : "권한 정보를 불러오고 있습니다..."}
					progress={currentState.loadingProgress}
				/>
			</Card>
		{:else if currentState?.error}
			<Card class="shadow-xl border-red-200 bg-white/95 backdrop-blur-sm">
				<ErrorState error={currentState.error} onRetry={handleRetry} onGoBack={handleGoBack} />
			</Card>
		{:else if currentState?.client}
			<Card class="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden max-w-lg">
				<!-- 앱 정보 헤더 -->
				<div class="px-8 py-6 text-center border-b border-gray-100">
					<div class="flex flex-col items-center space-y-4">
						<!-- 큰 앱 아이콘 -->
						<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
							<i class="fas fa-shield-alt text-2xl text-white"></i>
						</div>

						<!-- 앱 이름과 설명 -->
						<div>
							<h1 class="text-xl font-bold text-gray-900 mb-1">
								{currentState.client?.name || '알 수 없는 앱'}
							</h1>
							<p class="text-sm text-gray-600">
								귀하의 계정에 접근하려고 합니다
							</p>
						</div>
					</div>
				</div>

				<!-- 권한 목록 -->
				<div class="px-8 py-6">
					<h3 class="text-sm font-semibold text-gray-900 mb-4 text-center">
						이 앱이 요청하는 권한
					</h3>

					<div class="space-y-3">
						{#each currentState.scopes || [] as scope (scope)}
							<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
								<div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
									<i class="fas fa-check text-green-600 text-sm"></i>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900 capitalize">
										{scope.replace(/_/g, ' ')}
									</p>
									<p class="text-xs text-gray-600">
										앱이 {scope.replace(/_/g, ' ')} 권한을 사용할 수 있습니다
									</p>
								</div>
							</div>
						{/each}
					</div>

					<!-- 보안 알림 -->
					<div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
						<div class="flex items-start space-x-2">
							<i class="fas fa-info-circle text-amber-600 mt-0.5 text-sm"></i>
							<div>
								<p class="text-sm font-medium text-amber-800 mb-1">
									신뢰할 수 있는 앱인지 확인하세요
								</p>
								<p class="text-xs text-amber-700">
									승인 후 앱이 귀하의 데이터에 접근할 수 있습니다
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- 액션 버튼 -->
				<div class="px-8 py-6 border-t border-gray-100 bg-gray-50">
					<div class="space-y-4">
						<div class="flex space-x-3">
							<button
								onclick={handleDeny}
								disabled={currentState.submitting}
								class="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
							>
								취소
							</button>
							<button
								onclick={handleApprove}
								disabled={currentState.submitting}
								class="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
							>
								{#if currentState.submitting}
									<i class="fas fa-spinner fa-spin mr-2"></i>
									승인 중...
								{:else}
									승인
								{/if}
							</button>
						</div>

						<!-- Redirect URL 표시 -->
						<div class="text-center">
							<p class="text-xs text-gray-500">
								승인 시 다음 URL로 이동합니다:
								<span class="text-gray-700 break-all">
									{data.authorizeParams?.redirect_uri || 'N/A'}
								</span>
							</p>
						</div>
					</div>
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	/* 모바일 최적화 */
	@media (max-width: 640px) {
		/* 버튼 터치 타겟 개선 */
		button {
			min-height: 44px;
		}
	}
</style>
