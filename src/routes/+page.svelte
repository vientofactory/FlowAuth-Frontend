<script lang="ts">
	import { Button, Navigation } from '$lib';
	import Footer from '$lib/components/Footer.svelte';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { USER_TYPES } from '$lib';
	import type { User } from '$lib';
	import './+page.css';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faShieldAlt,
		faRocket,
		faBook,
		faExternalLinkAlt,
		faBolt,
		faChartLine,
		faCodeBranch,
		faCheckCircle,
		faTachometerAlt,
		faUser,
		faPlug,
		faCubes,
		faCog,
		faChevronDown,
		faSpinner
	} from '@fortawesome/free-solid-svg-icons';
	import { faGithub } from '@fortawesome/free-brands-svg-icons';
	import { fade } from 'svelte/transition';

	let user: User | null = null;
	let isAuthenticated = false;
	let isLoading = true;
	let isInitialized = false;

	onMount(() => {
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isAuthenticated = state.isAuthenticated;
			isLoading = state.isLoading;
			isInitialized = state.isInitialized;
		});

		return unsubscribe;
	});

	// 페이지 로딩 상태 계산
	$: isPageLoading = !isInitialized || isLoading;

	// 사용자 유형별 콘텐츠 결정
	$: userType = user?.userType || null;
	$: isDeveloper = userType === USER_TYPES.DEVELOPER;

	function handleKeyDown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<svelte:head>
	<title>FlowAuth - OAuth2 인증 시스템</title>
	<meta name="description" content="OAuth 2.0 표준을 준수하는 개방형 인증 시스템" />
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-gray-50 via-stone-50 to-neutral-100">
	<div class="relative">
		<!-- 배경 패턴 -->
		<div
			class="absolute inset-0 opacity-20"
			style="background-image: radial-gradient(circle at 1px 1px, rgba(156, 146, 172, 0.15) 1px, transparent 0); background-size: 20px 20px;"
		></div>
		<!-- 공통 네비게이션 -->
		<Navigation transparent={true} />

		<!-- 히어로 섹션 -->
		<div
			class="absolute inset-0 flex flex-col items-center justify-between px-6 py-16 pt-60 pb-20 text-center"
			style="height: 100vh;"
		>
			<!-- 메인 히어로 콘텐츠 -->
			<div class="flex flex-col items-center">
				{#if isPageLoading}
					<!-- 로딩 상태 스켈레톤 -->
					<div transition:fade={{ duration: 300 }}>
						<div
							class="mb-6 inline-flex animate-pulse items-center rounded-full bg-stone-100 px-4 py-2"
						>
							<div class="h-4 w-40 rounded bg-stone-200"></div>
						</div>
						<div class="mb-6 animate-pulse">
							<div class="mx-auto h-16 w-3/4 rounded bg-slate-200"></div>
						</div>
						<div class="mb-6 animate-pulse">
							<div class="mx-auto h-16 w-2/3 rounded bg-slate-200"></div>
						</div>
						<div class="mb-10 animate-pulse">
							<div class="mx-auto h-6 w-3/4 rounded bg-slate-200"></div>
						</div>
						<div class="mb-4 text-center text-slate-500">
							<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
							메인 화면을 준비하고 있어요...
						</div>
						<div class="mb-10 flex animate-pulse justify-center gap-4">
							<div class="h-16 w-40 rounded-lg bg-slate-200"></div>
							<div class="h-16 w-40 rounded-lg bg-slate-200"></div>
						</div>
					</div>
				{:else if !isAuthenticated}
					<!-- 비로그인 사용자용 히어로 -->
					<div transition:fade={{ duration: 500, delay: 300 }}>
						<div
							class="mb-6 inline-flex items-center rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700"
						>
							<FontAwesomeIcon icon={faShieldAlt} class="mr-2" />
							OAuth 2.0 & OpenID Connect
						</div>

						<h1
							class="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl"
						>
							<span class="block">안전한 인증,</span>
							<span
								class="block bg-linear-to-r from-stone-600 via-gray-600 to-slate-600 bg-clip-text text-transparent"
							>
								간편한 통합
							</span>
						</h1>

						<p class="mx-auto mb-10 max-w-4xl text-lg leading-relaxed text-slate-600 sm:text-xl">
							표준을 준수하는 OAuth2/OIDC 플랫폼으로<br class="hidden sm:block" />
							여러분의 애플리케이션에 강력한 인증을 더하세요
						</p>

						<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								variant="primary"
								onclick={() => goto('/auth/register')}
								class="group w-full px-8 py-4 text-lg font-semibold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:w-auto"
								aria-label="무료 시작하기 버튼"
							>
								<FontAwesomeIcon
									icon={faRocket}
									class="mr-2 transition-transform group-hover:translate-x-1"
								/>
								무료 시작하기
							</Button>
							<a
								href="https://op0.gitbook.io/flowauth"
								target="_blank"
								rel="noopener noreferrer"
								class="group inline-flex w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-white/60 px-6 py-2 text-lg font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl sm:w-auto"
								aria-label="문서 보기 링크"
							>
								<FontAwesomeIcon
									icon={faBook}
									class="mr-2 transition-transform group-hover:scale-105"
								/>
								문서 보기
							</a>
						</div>
					</div>
				{:else}
					<!-- 로그인 사용자용 히어로 -->
					<div transition:fade={{ duration: 500, delay: 300 }}>
						<div
							class="mb-6 inline-flex items-center rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700"
						>
							<FontAwesomeIcon icon={faCheckCircle} class="mr-2" />
							환영합니다, {user?.username || '사용자'}님
						</div>

						<h1
							class="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-7xl"
						>
							<span class="block">안전한 인증,</span>
							<span
								class="block bg-linear-to-r from-stone-600 via-gray-600 to-slate-600 bg-clip-text text-transparent"
							>
								지속적인 관리
							</span>
						</h1>

						<p class="mx-auto mb-10 max-w-4xl text-lg leading-relaxed text-slate-600 sm:text-xl">
							귀하의 OAuth2/OIDC 인증 시스템을<br class="hidden sm:block" />
							효율적으로 관리하고 모니터링하세요
						</p>

						<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								variant="primary"
								onclick={() => goto('/dashboard')}
								class="group w-full px-8 py-4 text-lg font-semibold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:w-auto"
								aria-label="대시보드 바로가기 버튼"
							>
								<FontAwesomeIcon
									icon={faTachometerAlt}
									class="mr-2 transition-transform group-hover:translate-x-1"
								/>
								대시보드 바로가기
							</Button>
							<a
								href="https://op0.gitbook.io/flowauth"
								target="_blank"
								rel="noopener noreferrer"
								class="group inline-flex w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-white/60 px-6 py-2 text-lg font-semibold shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-xl sm:w-auto"
								aria-label="문서 보기 링크"
							>
								<FontAwesomeIcon
									icon={faBook}
									class="mr-2 transition-transform group-hover:scale-105"
								/>
								문서 보기
							</a>
						</div>
					</div>
				{/if}
			</div>

			<!-- 스크롤 유도 -->
			<div class="self-center">
				<FontAwesomeIcon icon={faChevronDown} class="animate-bounce text-2xl text-slate-400" />
			</div>
		</div>

		<!-- 메인 콘텐츠 -->
		<main class="relative" style="margin-top: 100vh;">
			<div class="px-12 py-16 sm:px-16 sm:py-24 lg:px-20 lg:py-32">
				{#if isPageLoading}
					<!-- 특징 섹션 스켈레톤 -->
					<div class="mt-24 sm:mt-32" transition:fade={{ duration: 300 }}>
						<div class="mb-16 text-center">
							<div class="mx-auto mb-4 h-10 w-96 animate-pulse rounded bg-gray-200"></div>
							<div class="mx-auto h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>
						</div>

						<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
							{#each Array(4) as _, i (i)}
								<div class="group px-6 text-center">
									<div class="mx-auto mb-6 h-16 w-16 animate-pulse rounded-2xl bg-gray-200"></div>
									<div class="mb-3 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
									<div class="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
									<div class="mt-2 h-4 w-28 animate-pulse rounded bg-gray-200"></div>
									<div class="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
								</div>
							{/each}
						</div>
					</div>

					<!-- 시작하기 섹션 스켈레톤 -->
					<div class="mt-24 sm:mt-32" transition:fade={{ duration: 300 }}>
						<div class="mb-16 text-center">
							<div class="mx-auto mb-4 h-10 w-80 animate-pulse rounded bg-gray-200"></div>
							<div class="mx-auto h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>
						</div>

						<div class="relative">
							<div class="grid gap-12 lg:grid-cols-3">
								{#each Array(3) as _, i (i)}
									<div class="relative px-6 text-center lg:text-left">
										<div
											class="mx-auto mb-6 h-16 w-16 animate-pulse rounded-full bg-gray-200 lg:mx-0"
										></div>
										<div class="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200"></div>
										<div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
										<div class="mt-2 h-4 w-28 animate-pulse rounded bg-gray-200"></div>
										<div class="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if !isAuthenticated}
					<!-- 특징 섹션 -->
					<div class="mt-24 sm:mt-32" transition:fade={{ duration: 500, delay: 400 }}>
						<div class="mb-16 text-center">
							<h2 class="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
								왜 FlowAuth를 선택할까요?
							</h2>
							<p class="mx-auto max-w-4xl text-lg text-slate-600">
								개발자 친화적인 OAuth2 솔루션으로 더 빠르고 안전한 인증을 구현하세요
							</p>
						</div>

						<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
							<div class="group px-6 text-center">
								<div
									class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-r from-stone-500 to-stone-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
								>
									<FontAwesomeIcon icon={faShieldAlt} class="text-2xl text-white" />
								</div>
								<h3 class="mb-3 text-xl font-bold text-slate-900">다중화된 보안 계층</h3>
								<p class="mb-2 text-slate-600">
									다중화된 보안 계층으로 <br />
									귀하의 데이터를 안전하게 보호합니다
								</p>
								<a
									href="https://op0.gitbook.io/flowauth/security"
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-700 hover:underline"
								>
									<FontAwesomeIcon icon={faExternalLinkAlt} />
									보안 문서 보기
								</a>
							</div>

							<div class="group px-6 text-center">
								<div
									class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-r from-neutral-500 to-neutral-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
								>
									<FontAwesomeIcon icon={faBolt} class="text-2xl text-white" />
								</div>
								<h3 class="mb-3 text-xl font-bold text-slate-900">번개 같은 속도</h3>
								<p class="text-slate-600">
									최적화된 아키텍처로<br />
									밀리초 단위의 빠른 응답을 보장합니다
								</p>
							</div>

							<div class="group px-6 text-center">
								<div
									class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-r from-gray-500 to-gray-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
								>
									<FontAwesomeIcon icon={faChartLine} class="text-2xl text-white" />
								</div>
								<h3 class="mb-3 text-xl font-bold text-slate-900">실시간 모니터링</h3>
								<p class="text-slate-600">
									상세한 대시보드로<br />
									인증 현황을 실시간으로 모니터링하세요
								</p>
							</div>

							<div class="group px-6 text-center">
								<div
									class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-r from-slate-500 to-slate-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
								>
									<FontAwesomeIcon icon={faCodeBranch} class="text-2xl text-white" />
								</div>
								<h3 class="mb-3 text-xl font-bold text-slate-900">오픈소스 자유</h3>
								<p class="text-slate-600">
									누구나 무료로 사용하고<br />
									직접 커스터마이즈할 수 있습니다
								</p>
							</div>
						</div>
					</div>

					<!-- 시작하기 섹션 -->
					<div class="mt-24 sm:mt-32" transition:fade={{ duration: 500, delay: 550 }}>
						<div class="mb-16 text-center">
							<h2 class="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">3단계로 시작하기</h2>
							<p class="mx-auto max-w-4xl text-lg text-slate-600">
								FlowAuth를 시작하는 가장 빠른 방법
							</p>
						</div>

						<div class="relative">
							<div
								class="absolute top-8 left-1/2 hidden h-0.5 w-full -translate-x-1/2 transform bg-linear-to-r from-stone-200 via-gray-200 to-neutral-200 lg:block"
							></div>

							<div class="grid gap-12 lg:grid-cols-3">
								<div class="relative px-6 text-center lg:text-left">
									<div
										class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-stone-500 to-stone-600 text-white shadow-lg lg:mx-0"
									>
										<span class="text-2xl font-bold">1</span>
									</div>
									<h3 class="mb-4 text-xl font-bold text-slate-900">회원가입</h3>
									<p class="text-slate-600">
										간단한 회원가입으로<br />
										FlowAuth 계정을 만드세요
									</p>
								</div>

								<div class="relative px-6 text-center lg:text-left">
									<div
										class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-neutral-500 to-neutral-600 text-white shadow-lg lg:mx-0"
									>
										<span class="text-2xl font-bold">2</span>
									</div>
									<h3 class="mb-4 text-xl font-bold text-slate-900">앱 연결</h3>
									<p class="mb-2 text-slate-600">
										OAuth2 클라이언트를 생성하고<br />
										귀하의 애플리케이션과 연결하세요
									</p>
									<a
										href="https://github.com/vientofactory/FlowAuth-SDK"
										target="_blank"
										rel="noopener"
										class="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:underline"
									>
										<FontAwesomeIcon icon={faGithub} />
										클라이언트 SDK
									</a>
								</div>

								<div class="relative px-6 text-center lg:text-left">
									<div
										class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-r from-gray-500 to-gray-600 text-white shadow-lg lg:mx-0"
									>
										<span class="text-2xl font-bold">3</span>
									</div>
									<h3 class="mb-4 text-xl font-bold text-slate-900">통합 완료</h3>
									<p class="text-slate-600">
										실시간 대시보드로<br />
										안전하게 모니터링하세요
									</p>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- 로그인 사용자용 대시보드 위젯 -->
					<div class="mt-24 sm:mt-32" transition:fade={{ duration: 500, delay: 400 }}>
						<div class="mb-16 text-center">
							<h2 class="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">빠른 액션</h2>
							<p class="mx-auto max-w-4xl text-lg text-slate-600">
								자주 사용하는 기능에 바로 접근하세요
							</p>
						</div>

						<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
							<button
								onclick={() => goto('/dashboard')}
								onkeydown={(e) => handleKeyDown(e, () => goto('/dashboard'))}
								class="group flex cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/80 p-10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
								aria-label="대시보드 바로가기"
							>
								<div
									class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-r from-stone-500 to-stone-600 transition-transform duration-300 group-hover:scale-110"
								>
									<FontAwesomeIcon icon={faTachometerAlt} class="text-2xl text-white" />
								</div>
								<span class="text-lg font-semibold text-slate-900">대시보드</span>
							</button>

							<button
								onclick={() => goto('/dashboard/profile')}
								onkeydown={(e) => handleKeyDown(e, () => goto('/dashboard/profile'))}
								class="group flex cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/80 p-10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
								aria-label="프로필 바로가기"
							>
								<div
									class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-r from-neutral-500 to-neutral-600 transition-transform duration-300 group-hover:scale-110"
								>
									<FontAwesomeIcon icon={faUser} class="text-2xl text-white" />
								</div>
								<span class="text-lg font-semibold text-slate-900">프로필</span>
							</button>

							<button
								onclick={() => goto('/dashboard/connections')}
								onkeydown={(e) => handleKeyDown(e, () => goto('/dashboard/connections'))}
								class="group backdrop-lg flex cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/80 p-10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
								aria-label="연결 바로가기"
							>
								<div
									class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-r from-gray-500 to-gray-600 transition-transform duration-300 group-hover:scale-110"
								>
									<FontAwesomeIcon icon={faPlug} class="text-2xl text-white" />
								</div>
								<span class="text-lg font-semibold text-slate-900">연결</span>
							</button>

							{#if isDeveloper}
								<button
									onclick={() => goto('/dashboard/clients')}
									onkeydown={(e) => handleKeyDown(e, () => goto('/dashboard/clients'))}
									class="group flex cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/80 p-10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
									aria-label="클라이언트 바로가기"
								>
									<div
										class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-r from-slate-500 to-slate-600 transition-transform duration-300 group-hover:scale-110"
									>
										<FontAwesomeIcon icon={faCubes} class="text-2xl text-white" />
									</div>
									<span class="text-lg font-semibold text-slate-900">클라이언트</span>
								</button>
							{:else}
								<button
									onclick={() => goto('/dashboard/settings')}
									onkeydown={(e) => handleKeyDown(e, () => goto('/dashboard/settings'))}
									class="group flex cursor-pointer flex-col items-center rounded-2xl border-0 bg-white/80 p-10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
									aria-label="설정 바로가기"
								>
									<div
										class="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-r from-zinc-500 to-zinc-600 transition-transform duration-300 group-hover:scale-110"
									>
										<FontAwesomeIcon icon={faCog} class="text-2xl text-white" />
									</div>
									<span class="text-lg font-semibold text-slate-900">설정</span>
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</main>

		<!-- 푸터 -->
		<div class="relative z-10">
			<Footer />
		</div>
	</div>
</div>
