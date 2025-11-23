<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button, Navigation, Footer } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faLock,
		faBan,
		faSearch,
		faClock,
		faServer,
		faExclamationTriangle,
		faSignInAlt,
		faHome,
		faTachometerAlt,
		faArrowLeft,
		faRefresh,
		faCog
	} from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	// 에러 상태 관련 변수들
	let errorCode = $state(404);
	let errorMessage = $state('페이지를 찾을 수 없습니다');
	let errorDescription = $state('요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.');
	let showTechnicalDetails = $state(false);

	// 페이지 상태 변화 감지하여 에러 정보 추출
	$effect(() => {
		if (page.error) {
			// SvelteKit 에러 객체에서 정보 추출
			const error = page.error;
			errorCode = page.status || 500;

			// 에러 코드에 따른 메시지 설정
			setErrorContent(errorCode, error);
		}
	});

	// 에러 코드에 따른 내용 설정
	function setErrorContent(code: number, _error: unknown) {
		switch (code) {
			case 400:
				errorMessage = '잘못된 요청입니다';
				errorDescription = '요청에 문제가 있습니다. 입력한 정보를 다시 확인해주세요.';
				break;
			case 401:
				errorMessage = '인증이 필요합니다';
				errorDescription = '이 페이지에 접근하려면 로그인이 필요합니다.';
				break;
			case 403:
				errorMessage = '접근이 금지되었습니다';
				errorDescription = '이 페이지에 접근할 권한이 없습니다.';
				break;
			case 404:
				errorMessage = '페이지를 찾을 수 없습니다';
				errorDescription = '요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.';
				break;
			case 429:
				errorMessage = '요청이 너무 많습니다';
				errorDescription = '잠시 후 다시 시도해주세요.';
				break;
			case 500:
				errorMessage = '서버 오류가 발생했습니다';
				errorDescription = '일시적인 서버 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
				break;
			case 502:
				errorMessage = '게이트웨이 오류입니다';
				errorDescription = '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
				break;
			case 503:
				errorMessage = '서비스를 사용할 수 없습니다';
				errorDescription = '현재 서비스 점검 중입니다. 잠시 후 다시 시도해주세요.';
				break;
			default:
				errorMessage = '오류가 발생했습니다';
				errorDescription = '예기치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
		}
	}

	// 에러 코드에 따른 아이콘 반환
	function getErrorIcon(code: number): IconDefinition {
		switch (code) {
			case 401:
				return faLock;
			case 403:
				return faBan;
			case 404:
				return faSearch;
			case 429:
				return faClock;
			case 500:
			case 502:
			case 503:
				return faServer;
			default:
				return faExclamationTriangle;
		}
	}

	// 에러 코드에 따른 색상 반환
	function getErrorColor(code: number): string {
		if (code >= 400 && code < 500) {
			return 'text-orange-500';
		} else if (code >= 500) {
			return 'text-red-500';
		}
		return 'text-gray-500';
	}

	// 액션 함수들
	function goHome() {
		goto('/');
	}

	function goBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
		} else {
			goHome();
		}
	}

	function goToDashboard() {
		goto('/dashboard');
	}

	function goToLogin() {
		goto('/auth/login');
	}

	function toggleTechnicalDetails() {
		showTechnicalDetails = !showTechnicalDetails;
	}

	function refreshPage() {
		window.location.reload();
	}

	// 권장 액션 결정
	function getRecommendedActions(code: number): Array<{
		label: string;
		action: () => void;
		variant: 'primary' | 'outline' | 'secondary' | 'ghost' | 'success' | 'danger';
		icon: IconDefinition;
	}> {
		const actions: Array<{
			label: string;
			action: () => void;
			variant: 'primary' | 'outline' | 'secondary' | 'ghost' | 'success' | 'danger';
			icon: IconDefinition;
		}> = [];

		switch (code) {
			case 401:
				actions.push({
					label: '로그인',
					action: goToLogin,
					variant: 'primary' as const,
					icon: faSignInAlt
				});
				actions.push({
					label: '홈으로',
					action: goHome,
					variant: 'outline' as const,
					icon: faHome
				});
				break;
			case 403:
				actions.push({
					label: '대시보드로',
					action: goToDashboard,
					variant: 'primary' as const,
					icon: faTachometerAlt
				});
				actions.push({
					label: '홈으로',
					action: goHome,
					variant: 'outline' as const,
					icon: faHome
				});
				break;
			case 404:
				actions.push({
					label: '홈으로',
					action: goHome,
					variant: 'primary' as const,
					icon: faHome
				});
				actions.push({
					label: '이전 페이지',
					action: goBack,
					variant: 'outline' as const,
					icon: faArrowLeft
				});
				break;
			case 500:
			case 502:
			case 503:
				actions.push({
					label: '새로고침',
					action: refreshPage,
					variant: 'primary' as const,
					icon: faRefresh
				});
				actions.push({
					label: '홈으로',
					action: goHome,
					variant: 'outline' as const,
					icon: faHome
				});
				break;
			default:
				actions.push({
					label: '홈으로',
					action: goHome,
					variant: 'primary' as const,
					icon: faHome
				});
				actions.push({
					label: '이전 페이지',
					action: goBack,
					variant: 'outline' as const,
					icon: faArrowLeft
				});
		}

		return actions;
	}

	const recommendedActions = $derived(getRecommendedActions(errorCode));
</script>

<svelte:head>
	<title>{errorCode} - {errorMessage} | FlowAuth</title>
	<meta name="description" content={errorDescription} />
</svelte:head>

<!-- 네비게이션 (간소화된 버전) -->
<Navigation showDashboardButton={true} />

<div class="bg-linear-to-br from-gray-50 via-white to-gray-100">
	<!-- 메인 에러 콘텐츠 - 완전히 화면 중앙에 위치 -->
	<main class="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
		<div class="w-full max-w-2xl text-center">
			<!-- 에러 아이콘 및 코드 -->
			<div class="mb-8">
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 shadow-lg"
				>
					<FontAwesomeIcon
						icon={getErrorIcon(errorCode)}
						class="{getErrorColor(errorCode)} text-3xl"
					/>
				</div>
				<div class="mb-4">
					<span
						class="inline-flex items-center rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800"
					>
						에러 {errorCode}
					</span>
				</div>
			</div>

			<!-- 에러 메시지 -->
			<div class="mb-8">
				<h1 class="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
					{errorMessage}
				</h1>
				<p class="text-lg text-gray-600 sm:text-xl">
					{errorDescription}
				</p>
			</div>

			<!-- 권장 액션 버튼들 -->
			<div class="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
				{#each recommendedActions as action (action.label)}
					<Button variant={action.variant} size="lg" onclick={action.action} class="sm:w-auto">
						<FontAwesomeIcon icon={action.icon} class="mr-2" />
						{action.label}
					</Button>
				{/each}
			</div>

			<!-- 기술적 세부사항 토글 -->
			{#if page.error}
				<div class="text-center">
					<button
						onclick={toggleTechnicalDetails}
						class="cursor-pointer text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700"
					>
						<FontAwesomeIcon icon={faCog} class="mr-1" />
						세부사항 {showTechnicalDetails ? '숨기기' : '보기'}
					</button>

					{#if showTechnicalDetails}
						<div class="mt-4 rounded-lg bg-gray-50 p-4 text-left">
							<div class="mb-2">
								<span class="text-sm font-medium text-gray-700">경로:</span>
								<span class="ml-2 font-mono text-sm text-gray-600">{page.url.pathname}</span>
							</div>
							{#if page.error.message}
								<div class="mb-2">
									<span class="text-sm font-medium text-gray-700">메시지:</span>
									<span class="ml-2 font-mono text-sm text-gray-600">{page.error.message}</span>
								</div>
							{/if}
							<div class="mb-2">
								<span class="text-sm font-medium text-gray-700">시간:</span>
								<span class="ml-2 font-mono text-sm text-gray-600"
									>{new Date().toLocaleString('ko-KR')}</span
								>
							</div>
							<div>
								<span class="text-sm font-medium text-gray-700">요청 ID:</span>
								<span class="ml-2 font-mono text-sm text-gray-600"
									>{crypto.randomUUID().slice(0, 8)}</span
								>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- 푸터 - 별도 섹션으로 분리하여 스크롤해야 보임 -->
<Footer />

<style>
	/* 애니메이션 효과 */
	main {
		animation: fadeInUp 0.6s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* 버튼 호버 효과 개선 */
	:global(.error-page-button) {
		transition: all 0.2s ease-in-out;
	}

	:global(.error-page-button:hover) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
</style>
