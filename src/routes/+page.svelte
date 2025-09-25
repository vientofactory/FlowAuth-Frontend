<script lang="ts">
	import { Card, Button, Navigation } from '$lib';
	import Footer from '$lib/components/Footer.svelte';
	import { STYLE_CONSTANTS } from '$lib/constants/app.constants';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { USER_TYPES } from '$lib/types/user.types';
	import type { User } from '$lib';
	import './+page.css';

	let user: User | null = null;
	let isAuthenticated = false;
	let isLoading = true;

	onMount(() => {
		const unsubscribe = authState.subscribe((state) => {
			user = state.user;
			isAuthenticated = state.isAuthenticated;
			isLoading = state.isLoading;
		});

		return unsubscribe;
	});

	// 사용자 유형별 콘텐츠 결정
	$: userType = user?.userType || null;
	$: isDeveloper = userType === USER_TYPES.DEVELOPER;
	$: isRegularUser = userType === USER_TYPES.REGULAR;
</script>

<svelte:head>
	<title>FlowAuth - OAuth2 인증 시스템</title>
	<meta name="description" content="OAuth 2.0 표준을 준수하는 개방형 인증 시스템" />
</svelte:head>

<div class={STYLE_CONSTANTS.BACKGROUND.PAGE}>
	<div class={STYLE_CONSTANTS.BACKGROUND.PAGE}>
		<!-- 공통 네비게이션 -->
		<Navigation transparent={true} />

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
			<!-- 히어로 섹션 -->
			<div class="mb-12 text-center sm:mb-16 lg:mb-20">
				{#if isLoading}
					<!-- 로딩 상태 -->
					<div class="flex items-center justify-center py-12">
						<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
					</div>
				{:else if !isAuthenticated}
					<!-- 비로그인 사용자용 히어로 -->
					<div
						class="mb-6 inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 sm:px-4 sm:py-2 sm:text-sm"
					>
						<span class="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 sm:mr-2 sm:h-2 sm:w-2"></span>
						OAuth2 인증 시스템의 새로운 표준
					</div>

					<h2
						class="mb-4 text-3xl leading-tight font-bold text-gray-900 sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl"
					>
						강력하고 <span
							class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
							>혁신적인</span
						><br class="hidden sm:block" />
						<span class="sm:hidden"> </span>인증 플랫폼
					</h2>

					<p
						class="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-lg lg:text-xl"
					>
						신뢰할 수 있는 오픈소스 개방형 인증 시스템으로<br class="hidden sm:block" />
						애플리케이션의 인증을 쉽고 안전하게 관리하세요
					</p>

					<div
						class="mb-8 flex flex-col items-center justify-center gap-3 sm:mb-12 sm:flex-row sm:gap-4"
					>
						<Button
							variant="primary"
							onclick={() => goto('/auth/register')}
							class="w-full transform px-6 py-3 text-base shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-rocket mr-2"></i>
							무료로 시작하기
						</Button>
						<Button
							variant="outline"
							onclick={() => (window.location.href = '/docs')}
							class="w-full border-2 px-6 py-3 text-base transition-colors duration-200 hover:bg-blue-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-book mr-2"></i>
							문서 보기
						</Button>
					</div>
				{:else if isRegularUser}
					<!-- 일반 사용자용 웰컴 메시지 -->
					<div class="mb-6">
						<div
							class="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 sm:px-4 sm:py-2 sm:text-sm"
						>
							<i class="fas fa-user mr-2"></i>
							일반 사용자 대시보드
						</div>
					</div>

					<h2
						class="mb-4 text-3xl leading-tight font-bold text-gray-900 sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl"
					>
						안녕하세요, <span
							class="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"
							>{user?.firstName}</span
						>님!
					</h2>

					<p
						class="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-lg lg:text-xl"
					>
						귀하의 계정을 안전하게 보호하고,<br class="hidden sm:block" />
						연결된 앱들을 쉽게 관리하세요
					</p>

					<div
						class="mb-8 flex flex-col items-center justify-center gap-3 sm:mb-12 sm:flex-row sm:gap-4"
					>
						<Button
							variant="primary"
							onclick={() => goto('/dashboard')}
							class="w-full transform px-6 py-3 text-base shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-tachometer-alt mr-2"></i>
							대시보드 보기
						</Button>
						<Button
							variant="outline"
							onclick={() => goto('/dashboard/connections')}
							class="w-full border-2 px-6 py-3 text-base transition-colors duration-200 hover:bg-green-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-plug mr-2"></i>
							연결된 앱 관리
						</Button>
					</div>
				{:else if isDeveloper}
					<!-- 개발자용 웰컴 메시지 -->
					<div class="mb-6">
						<div
							class="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-800 sm:px-4 sm:py-2 sm:text-sm"
						>
							<i class="fas fa-code mr-2"></i>
							개발자 대시보드
						</div>
					</div>

					<h2
						class="mb-4 text-3xl leading-tight font-bold text-gray-900 sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl"
					>
						환영합니다, <span
							class="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent"
							>{user?.firstName}</span
						>님!
					</h2>

					<p
						class="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-lg lg:text-xl"
					>
						OAuth2 애플리케이션을 구축하고,<br class="hidden sm:block" />
						강력한 인증 시스템을 활용하세요
					</p>

					<div
						class="mb-8 flex flex-col items-center justify-center gap-3 sm:mb-12 sm:flex-row sm:gap-4"
					>
						<Button
							variant="primary"
							onclick={() => goto('/dashboard')}
							class="w-full transform px-6 py-3 text-base shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-tachometer-alt mr-2"></i>
							대시보드 보기
						</Button>
						<Button
							variant="outline"
							onclick={() => goto('/dashboard/clients')}
							class="w-full border-2 px-6 py-3 text-base transition-colors duration-200 hover:bg-purple-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
						>
							<i class="fas fa-cubes mr-2"></i>
							내 애플리케이션
						</Button>
					</div>
				{/if}
			</div>

			<!-- 특징 섹션 -->
			<div class="mb-12 sm:mb-16 lg:mb-20">
				{#if !isAuthenticated}
					<!-- 비로그인 사용자용 특징 -->
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							왜 FlowAuth를 선택해야 할까요?
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							개발자 친화적인 OAuth2 솔루션으로 더 빠르고 안전한 인증을 구현하세요
						</p>
					</div>

					<div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4">
						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-shield-alt text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-shield-alt mr-1.5 text-blue-600 sm:mr-2"></i>
									군사급 보안
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									JWT 토큰과 bcrypt 해싱으로 사용자 데이터를<br class="hidden sm:block" />
									최고 수준의 보안으로 보호합니다
								</p>
							</div>
						</Card>

						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-bolt text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-bolt mr-1.5 text-green-600 sm:mr-2"></i>
									번개 같은 속도
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									최적화된 아키텍처로 밀리초 단위의<br class="hidden sm:block" />
									빠른 인증 응답을 제공합니다
								</p>
							</div>
						</Card>

						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-chart-line text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-chart-line mr-1.5 text-purple-600 sm:mr-2"></i>
									실시간 모니터링
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									상세한 대시보드로 인증 현황을<br class="hidden sm:block" />
									실시간으로 모니터링하세요
								</p>
							</div>
						</Card>

						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl xl:col-span-1"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-code-branch text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-code-branch mr-1.5 text-blue-700 sm:mr-2"></i>
									오픈소스의 자유
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									누구나 무료로 사용하고<br class="hidden sm:block" />
									직접 기여하거나 커스터마이즈할 수 있습니다
								</p>
							</div>
						</Card>
					</div>
				{:else if isRegularUser}
					<!-- 일반 사용자용 빠른 액션 가이드 -->
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							빠른 시작 가이드
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							FlowAuth를 효과적으로 사용하기 위한 주요 기능들을 만나보세요
						</p>
					</div>

					<div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-plug text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-plug mr-1.5 text-green-600 sm:mr-2"></i>
									연결된 앱 관리
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									귀하의 계정에 연결된 애플리케이션들을<br class="hidden sm:block" />
									확인하고 안전하게 관리하세요
								</p>
								<div class="mt-4">
									<Button
										variant="outline"
										size="sm"
										onclick={() => goto('/dashboard/connections')}
										class="w-full"
									>
										관리하기
									</Button>
								</div>
							</div>
						</Card>

						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-shield-alt text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-shield-alt mr-1.5 text-blue-600 sm:mr-2"></i>
									보안 설정
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									2단계 인증을 활성화하여<br class="hidden sm:block" />
									계정을 더욱 안전하게 보호하세요
								</p>
								<div class="mt-4">
									<Button
										variant="outline"
										size="sm"
										onclick={() => goto('/dashboard/settings')}
										class="w-full"
									>
										설정하기
									</Button>
								</div>
							</div>
						</Card>

						<Card
							class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
						>
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
								>
									<i class="fas fa-user text-lg text-white sm:text-xl lg:text-2xl"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
									<i class="fas fa-user mr-1.5 text-purple-600 sm:mr-2"></i>
									프로필 관리
								</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									개인 정보를 업데이트하고<br class="hidden sm:block" />
									프로필을 완성하세요
								</p>
								<div class="mt-4">
									<Button
										variant="outline"
										size="sm"
										onclick={() => goto('/dashboard/profile')}
										class="w-full"
									>
										관리하기
									</Button>
								</div>
							</div>
						</Card>
					</div>
				{:else if isDeveloper}
					<!-- 개발자용 기술 가이드 -->
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							개발자 도구 모음
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							OAuth2 애플리케이션 개발을 위한 강력한 도구들과 리소스들을 활용하세요
						</p>
					</div>

					<div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
						{#if user?.userType === USER_TYPES.DEVELOPER}
							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-cubes text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-cubes mr-1.5 text-purple-600 sm:mr-2"></i>
										내 애플리케이션
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										OAuth2 클라이언트를 생성하고<br class="hidden sm:block" />
										관리하며 통계를 확인하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => goto('/dashboard/clients')}
											class="w-full"
										>
											관리하기
										</Button>
									</div>
								</div>
							</Card>

							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-flask text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-flask mr-1.5 text-blue-600 sm:mr-2"></i>
										OAuth2 테스터
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										실시간으로 OAuth2 플로우를 테스트하고<br class="hidden sm:block" />
										디버깅하며 개발하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => goto('/dashboard/oauth-tester')}
											class="w-full"
										>
											테스트하기
										</Button>
									</div>
								</div>
							</Card>

							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-book text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-book mr-1.5 text-green-600 sm:mr-2"></i>
										API 문서
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										포괄적인 API 문서와<br class="hidden sm:block" />
										샘플 코드로 빠른 개발을 시작하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => (window.location.href = '/docs')}
											class="w-full"
										>
											문서 보기
										</Button>
									</div>
								</div>
							</Card>
						{:else}
							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-link text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-link mr-1.5 text-indigo-600 sm:mr-2"></i>
										연결된 앱
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										연결된 애플리케이션을<br class="hidden sm:block" />
										관리하고 권한을 제어하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => goto('/dashboard/connections')}
											class="w-full"
										>
											관리하기
										</Button>
									</div>
								</div>
							</Card>

							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-user text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-user mr-1.5 text-teal-600 sm:mr-2"></i>
										프로필 관리
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										개인 정보와 보안 설정을<br class="hidden sm:block" />
										관리하고 업데이트하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => goto('/dashboard/profile')}
											class="w-full"
										>
											관리하기
										</Button>
									</div>
								</div>
							</Card>

							<Card
								class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
							>
								<div class="text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 transition-transform duration-300 group-hover:scale-110 sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
									>
										<i class="fas fa-cog text-lg text-white sm:text-xl lg:text-2xl"></i>
									</div>
									<h4 class="mb-2 text-lg font-bold text-gray-900 sm:text-xl lg:text-xl">
										<i class="fas fa-cog mr-1.5 text-amber-600 sm:mr-2"></i>
										설정
									</h4>
									<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
										시스템 설정과 개인화 옵션을<br class="hidden sm:block" />
										구성하고 관리하세요
									</p>
									<div class="mt-4">
										<Button
											variant="outline"
											size="sm"
											onclick={() => goto('/dashboard/settings')}
											class="w-full"
										>
											설정하기
										</Button>
									</div>
								</div>
							</Card>
						{/if}
					</div>
				{/if}
			</div>

			<!-- 빠른 시작 가이드 섹션 -->
			{#if !isAuthenticated}
				<div class="mb-12 sm:mb-16 lg:mb-20">
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							3단계로 시작하기
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							FlowAuth를 시작하는 가장 빠른 방법
						</p>
					</div>

					<div class="relative">
						<!-- 연결선 -->
						<div
							class="absolute top-24 left-1/2 hidden h-full w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-blue-500 to-purple-600 lg:block"
							style="z-index: -1;"
						></div>

						<div class="grid gap-8 lg:grid-cols-3 lg:gap-12">
							<!-- 단계 1 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg lg:mx-0"
								>
									<span class="text-xl font-bold">1</span>
								</div>
								<h4 class="mb-3 text-lg font-bold text-gray-900 sm:text-xl">회원가입 및 로그인</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									간단한 회원가입으로 FlowAuth 계정을 만들고<br class="hidden sm:block" />
									보안된 로그인 환경을 경험하세요
								</p>
							</div>

							<!-- 단계 2 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg lg:mx-0"
								>
									<span class="text-xl font-bold">2</span>
								</div>
								<h4 class="mb-3 text-lg font-bold text-gray-900 sm:text-xl">애플리케이션 연결</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									OAuth2 클라이언트를 생성하고<br class="hidden sm:block" />
									귀하의 애플리케이션과 연결하세요
								</p>
							</div>

							<!-- 단계 3 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg lg:mx-0"
								>
									<span class="text-xl font-bold">3</span>
								</div>
								<h4 class="mb-3 text-lg font-bold text-gray-900 sm:text-xl">통합 및 모니터링</h4>
								<p class="text-sm leading-relaxed text-gray-600 sm:text-base">
									실시간 대시보드로 인증 현황을 모니터링하고<br class="hidden sm:block" />
									안전하게 관리하세요
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if isRegularUser}
				<div class="mb-12 sm:mb-16 lg:mb-20">
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							계정 관리 가이드
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							귀하의 계정을 안전하고 효율적으로 관리하세요
						</p>
					</div>

					<div class="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
						<Card class="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"
								>
									<i class="fas fa-user-shield text-xl text-blue-600"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900">보안 강화</h4>
								<p class="text-sm text-gray-600">
									2단계 인증을 활성화하고<br />
									비밀번호를 정기적으로 변경하세요
								</p>
							</div>
						</Card>

						<Card class="border-0 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100"
								>
									<i class="fas fa-plug text-xl text-green-600"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900">연결 관리</h4>
								<p class="text-sm text-gray-600">
									연결된 애플리케이션들을<br />
									정기적으로 검토하고 정리하세요
								</p>
							</div>
						</Card>

						<Card class="border-0 bg-gradient-to-br from-purple-50 to-violet-50 p-6">
							<div class="text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100"
								>
									<i class="fas fa-bell text-xl text-purple-600"></i>
								</div>
								<h4 class="mb-2 text-lg font-bold text-gray-900">알림 설정</h4>
								<p class="text-sm text-gray-600">
									중요한 보안 이벤트에 대한<br />
									알림을 적절히 설정하세요
								</p>
							</div>
						</Card>
					</div>
				</div>
			{:else if isDeveloper}
				<div class="mb-12 sm:mb-16 lg:mb-20">
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
							개발자 온보딩 가이드
						</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							OAuth2 애플리케이션 개발을 위한 단계별 가이드
						</p>
					</div>

					<div class="relative">
						<!-- 연결선 -->
						<div
							class="absolute top-20 left-1/2 hidden h-full w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-purple-500 to-blue-600 lg:block"
							style="z-index: -1;"
						></div>

						<div class="grid gap-8 lg:grid-cols-4 lg:gap-8">
							<!-- 단계 1 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg lg:mx-0 lg:h-16 lg:w-16"
								>
									<span class="text-lg font-bold lg:text-xl">1</span>
								</div>
								<h4 class="mb-3 text-base font-bold text-gray-900 sm:text-lg lg:text-lg">
									클라이언트 등록
								</h4>
								<p class="text-sm leading-relaxed text-gray-600">
									OAuth2 클라이언트를 생성하고<br class="hidden sm:block" />
									필요한 설정을 구성하세요
								</p>
							</div>

							<!-- 단계 2 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg lg:mx-0 lg:h-16 lg:w-16"
								>
									<span class="text-lg font-bold lg:text-xl">2</span>
								</div>
								<h4 class="mb-3 text-base font-bold text-gray-900 sm:text-lg lg:text-lg">
									권한 범위 설정
								</h4>
								<p class="text-sm leading-relaxed text-gray-600">
									필요한 OAuth2 스코프를 선택하고<br class="hidden sm:block" />
									적절한 권한을 설정하세요
								</p>
							</div>

							<!-- 단계 3 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg lg:mx-0 lg:h-16 lg:w-16"
								>
									<span class="text-lg font-bold lg:text-xl">3</span>
								</div>
								<h4 class="mb-3 text-base font-bold text-gray-900 sm:text-lg lg:text-lg">
									통합 구현
								</h4>
								<p class="text-sm leading-relaxed text-gray-600">
									애플리케이션에 OAuth2 플로우를<br class="hidden sm:block" />
									구현하고 테스트하세요
								</p>
							</div>

							<!-- 단계 4 -->
							<div class="relative text-center lg:text-left">
								<div
									class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg lg:mx-0 lg:h-16 lg:w-16"
								>
									<span class="text-lg font-bold lg:text-xl">4</span>
								</div>
								<h4 class="mb-3 text-base font-bold text-gray-900 sm:text-lg lg:text-lg">
									배포 및 모니터링
								</h4>
								<p class="text-sm leading-relaxed text-gray-600">
									프로덕션 환경에 배포하고<br class="hidden sm:block" />
									실시간으로 모니터링하세요
								</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- 퀵 액션 카드 섹션 -->
			{#if isAuthenticated}
				<div class="mb-12 sm:mb-16 lg:mb-20">
					<div class="mb-8 text-center sm:mb-12 lg:mb-16">
						<h3 class="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">빠른 액션</h3>
						<p class="mx-auto max-w-xl text-sm text-gray-600 sm:max-w-2xl sm:text-base lg:text-lg">
							자주 사용하는 기능에 바로 접근하세요
						</p>
					</div>

					<div class="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 xl:grid-cols-6">
						<!-- 대시보드 -->
						<button
							onclick={() => goto('/dashboard')}
							class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
						>
							<div
								class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-tachometer-alt text-lg text-white"></i>
							</div>
							<span class="text-sm font-medium text-gray-900">대시보드</span>
						</button>

						<!-- 프로필 -->
						<button
							onclick={() => goto('/dashboard/profile')}
							class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
						>
							<div
								class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-user text-lg text-white"></i>
							</div>
							<span class="text-sm font-medium text-gray-900">프로필</span>
						</button>

						<!-- 설정 -->
						<button
							onclick={() => goto('/dashboard/settings')}
							class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
						>
							<div
								class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-cog text-lg text-white"></i>
							</div>
							<span class="text-sm font-medium text-gray-900">설정</span>
						</button>

						<!-- 연결 관리 -->
						<button
							onclick={() => goto('/dashboard/connections')}
							class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							<div
								class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-plug text-lg text-white"></i>
							</div>
							<span class="text-sm font-medium text-gray-900">연결</span>
						</button>

						<!-- 개발자 전용 액션 -->
						{#if isDeveloper}
							<button
								onclick={() => goto('/dashboard/clients')}
								class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none"
							>
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 transition-transform duration-300 group-hover:scale-110"
								>
									<i class="fas fa-cubes text-lg text-white"></i>
								</div>
								<span class="text-sm font-medium text-gray-900">클라이언트</span>
							</button>

							<button
								onclick={() => goto('/dashboard/oauth-tester')}
								class="group flex cursor-pointer flex-col items-center rounded-xl border-0 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
							>
								<div
									class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 transition-transform duration-300 group-hover:scale-110"
								>
									<i class="fas fa-flask text-lg text-white"></i>
								</div>
								<span class="text-sm font-medium text-gray-900">테스터</span>
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</main>

		<!-- 푸터 -->
		<Footer />
	</div>
</div>
