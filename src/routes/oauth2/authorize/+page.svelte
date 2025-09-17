<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import LoadingState from '$lib/components/oauth2/LoadingState.svelte';
	import ErrorState from '$lib/components/oauth2/ErrorState.svelte';
	import { useAuthorization } from '$lib/hooks/useAuthorization';
	import type { AuthorizationState } from '$lib/types/authorization.types';
	import { ErrorType } from '$lib/types/authorization.types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// 권한 부여 훅 사용
	const {
		state: authState,
		handleConsent,
		retryAuthorization,
		loadAuthorizationData
	} = useAuthorization(data);

	// 상태 구독
	let currentState = $state<AuthorizationState | null>(null);
	const unsubscribe = authState.subscribe((value) => {
		currentState = value;
	});

	onMount(() => {
		console.log('[Page] Component mounted, starting authorization data load');
		loadAuthorizationData();

		// 추가 안전장치: 45초 후에도 로딩 중이면 강제로 에러 상태로 전환
		setTimeout(() => {
			authState.update((current) => {
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

	// 로고 로딩 상태 관리
	let _logoLoaded = $state(false);
	let logoError = $state(false);

	// 로고 상태 초기화
	$effect(() => {
		if (currentState && currentState.client?.logoUri) {
			_logoLoaded = false;
			logoError = false;
		}
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
			<Card class="border-0 bg-white/95 shadow-xl backdrop-blur-sm">
				<LoadingState
					message={currentState.loadingProgress < 50
						? '보안 검증을 준비하고 있습니다...'
						: currentState.loadingProgress < 80
							? '클라이언트 정보를 확인하고 있습니다...'
							: '권한 정보를 불러오고 있습니다...'}
					progress={currentState.loadingProgress}
				/>
			</Card>
		{:else if currentState?.error}
			<Card class="border-red-200 bg-white/95 shadow-xl backdrop-blur-sm">
				<ErrorState error={currentState.error} onRetry={handleRetry} onGoBack={handleGoBack} />
			</Card>
		{:else if currentState?.client}
			<Card class="max-w-lg overflow-hidden border-0 bg-white/95 shadow-xl backdrop-blur-sm">
				<!-- 앱 정보 헤더 -->
				<div class="border-b border-gray-100 px-8 py-6 text-center">
					<div class="flex flex-col items-center space-y-4">
						<!-- 앱 로고 또는 기본 아이콘 -->
						<div
							class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
						>
							{#if currentState.client?.logoUri && !logoError}
								<img
									src={currentState.client.logoUri}
									alt="{currentState.client.name} 로고"
									class="h-14 w-14 rounded-xl object-cover"
									onload={() => (_logoLoaded = true)}
									onerror={() => (logoError = true)}
								/>
							{/if}
							{#if !currentState.client?.logoUri || logoError}
								<i class="fas fa-shield-alt text-2xl text-white"></i>
							{/if}
						</div>

						<!-- 앱 이름과 설명 -->
						<div>
							<h1 class="mb-1 text-xl font-bold text-gray-900">
								{currentState.client?.name || '알 수 없는 앱'}
							</h1>
							<p class="text-sm text-gray-600">귀하의 계정에 접근하려고 합니다</p>
						</div>
					</div>
				</div>

				<!-- 권한 목록 -->
				<div class="px-8 py-6">
					<h3 class="mb-4 text-center text-sm font-semibold text-gray-900">
						이 앱이 요청하는 권한
					</h3>

					<div class="space-y-3">
						{#each currentState.scopes || [] as scope (scope)}
							<div class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
								<div
									class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100"
								>
									<i class="fas fa-check text-sm text-green-600"></i>
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
					<div class="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
						<div class="flex items-start space-x-2">
							<i class="fas fa-info-circle mt-0.5 text-sm text-amber-600"></i>
							<div>
								<p class="mb-1 text-sm font-medium text-amber-800">
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
				<div class="border-t border-gray-100 bg-gray-50 px-8 py-6">
					<div class="space-y-4">
						<div class="flex space-x-3">
							<button
								onclick={handleDeny}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								취소
							</button>
							<button
								onclick={handleApprove}
								disabled={currentState.submitting}
								class="flex-1 cursor-pointer rounded-lg border border-transparent bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
								승인 시 다음 사이트로 이동합니다:
								<span class="break-all text-gray-700">
									{#if data.authorizeParams?.redirect_uri}
										{(() => {
											try {
												const url = new URL(data.authorizeParams.redirect_uri);
												return `${url.protocol}//${url.host}`;
											} catch {
												return 'N/A';
											}
										})()}
									{:else}
										N/A
									{/if}
								</span>
							</p>
							<p class="text-xs text-gray-500">
								애플리케이션의
								{#if currentState.client?.termsOfServiceUri}
									<a
										href={currentState.client.termsOfServiceUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-700 hover:text-blue-900"
									>
										이용약관
									</a>
								{:else}
									이용약관
								{/if}
								과
								{#if currentState.client?.policyUri}
									<a
										href={currentState.client.policyUri}
										target="_blank"
										rel="noopener noreferrer"
										class="text-blue-700 hover:text-blue-900"
									>
										개인정보처리방침
									</a>
								{:else}
									개인정보처리방침
								{/if}
								이 적용됩니다.
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
