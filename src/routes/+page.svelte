<script lang="ts">
	import { Card, Button } from '$lib';
</script>

<svelte:head>
	<title>FlowAuth - OAuth2 인증 시스템</title>
	<meta name="description" content="현대적인 OAuth2 인증 시스템" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
		<!-- 헤더 -->
		<header
			class="sticky top-0 z-50 border-b border-white/20 bg-white/80 shadow-lg backdrop-blur-md"
		>
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center space-x-2">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
						>
							<span class="text-sm font-bold text-white">FA</span>
						</div>
						<h1
							class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent"
						>
							FlowAuth
						</h1>
					</div>
					<nav class="hidden items-center space-x-8 md:flex">
						<a
							href="/auth/login"
							data-sveltekit-preload-data
							class="font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600"
							>로그인</a
						>
						<Button
							variant="primary"
							onclick={() => (window.location.href = '/auth/register')}
							class="shadow-md transition-shadow duration-200 hover:shadow-lg"
						>
							회원가입
						</Button>
					</nav>
					<!-- 모바일 메뉴 버튼 -->
					<div class="md:hidden">
						<button class="text-gray-600 hover:text-blue-600" aria-label="메뉴 열기">
							<i class="fas fa-bars text-xl"></i>
						</button>
					</div>
				</div>
			</div>
		</header>

		<!-- 메인 콘텐츠 -->
		<main class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
			<!-- 히어로 섹션 -->
			<div class="mb-20 text-center">
				<div
					class="mb-8 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800"
				>
					<span class="mr-2 h-2 w-2 rounded-full bg-blue-500"></span>
					OAuth2 인증 시스템의 새로운 표준
				</div>

				<h2 class="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl">
					안전하고 <span
						class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
						>현대적인</span
					><br />
					인증 솔루션
				</h2>

				<p class="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600">
					JWT 토큰 기반의 강력한 보안 시스템으로<br />
					애플리케이션의 인증을 쉽고 안전하게 관리하세요
				</p>

				<div class="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button
						variant="primary"
						onclick={() => (window.location.href = '/auth/register')}
						class="transform px-8 py-4 text-lg shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
					>
						<i class="fas fa-rocket mr-2"></i>
						무료로 시작하기
					</Button>
					<Button
						variant="outline"
						onclick={() => (window.location.href = '/docs')}
						class="border-2 px-8 py-4 text-lg transition-colors duration-200 hover:bg-blue-50"
					>
						<i class="fas fa-book mr-2"></i>
						문서 보기
					</Button>
				</div>
			</div>

			<!-- 특징 섹션 -->
			<div class="mb-20">
				<div class="mb-16 text-center">
					<h3 class="mb-4 text-3xl font-bold text-gray-900">왜 FlowAuth를 선택해야 할까요?</h3>
					<p class="mx-auto max-w-2xl text-lg text-gray-600">
						개발자 친화적인 OAuth2 솔루션으로 더 빠르고 안전한 인증을 구현하세요
					</p>
				</div>

				<div class="grid gap-8 md:grid-cols-3">
					<Card
						class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
					>
						<div class="text-center">
							<div
								class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-shield-alt text-2xl text-white"></i>
							</div>
							<h4 class="mb-3 text-xl font-bold text-gray-900">
								<i class="fas fa-shield-alt mr-2 text-blue-600"></i>
								군사급 보안
							</h4>
							<p class="leading-relaxed text-gray-600">
								JWT 토큰과 bcrypt 해싱으로 사용자 데이터를<br />
								최고 수준의 보안으로 보호합니다
							</p>
						</div>
					</Card>

					<Card
						class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
					>
						<div class="text-center">
							<div
								class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-bolt text-2xl text-white"></i>
							</div>
							<h4 class="mb-3 text-xl font-bold text-gray-900">
								<i class="fas fa-bolt mr-2 text-green-600"></i>
								번개 같은 속도
							</h4>
							<p class="leading-relaxed text-gray-600">
								최적화된 아키텍처로 밀리초 단위의<br />
								빠른 인증 응답을 제공합니다
							</p>
						</div>
					</Card>

					<Card
						class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
					>
						<div class="text-center">
							<div
								class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-chart-line text-2xl text-white"></i>
							</div>
							<h4 class="mb-3 text-xl font-bold text-gray-900">
								<i class="fas fa-chart-line mr-2 text-purple-600"></i>
								실시간 모니터링
							</h4>
							<p class="leading-relaxed text-gray-600">
								상세한 대시보드로 인증 현황을<br />
								실시간으로 모니터링하세요
							</p>
						</div>
					</Card>

					<Card
						class="group transform border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
					>
						<div class="text-center">
							<div
								class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-transform duration-300 group-hover:scale-110"
							>
								<i class="fas fa-code-branch text-2xl text-white"></i>
							</div>
							<h4 class="mb-3 text-xl font-bold text-gray-900">
								<i class="fas fa-code-branch mr-2 text-blue-700"></i>
								오픈소스의 자유
							</h4>
							<p class="leading-relaxed text-gray-600">
								누구나 무료로 사용하고<br />
								직접 기여하거나 커스터마이즈할 수 있습니다
							</p>
						</div>
					</Card>
				</div>
			</div>
		</main>

		<!-- 푸터 -->
		<footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
			<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
					<div class="col-span-1 md:col-span-2">
						<div class="mb-4 flex items-center space-x-2">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600"
							>
								<span class="text-sm font-bold text-white">FA</span>
							</div>
							<span class="text-xl font-bold">FlowAuth</span>
						</div>
						<p class="mb-4 max-w-md text-gray-300">
							오픈소스 OAuth2 인증 시스템으로 애플리케이션의 보안을 강화하세요.
						</p>
						<div class="flex space-x-4">
							<a
								href="https://github.com/vientofactory"
								class="text-gray-400 transition-colors duration-200 hover:text-white"
								aria-label="GitHub"
							>
								<i class="fab fa-github text-xl"></i>
							</a>
						</div>
					</div>

					<div>
						<h4 class="mb-4 text-lg font-semibold">제품</h4>
						<ul class="space-y-2">
							<li>
								<a
									href="/features"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									기능
								</a>
							</li>
							<li>
								<a
									href="/security"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									보안
								</a>
							</li>
							<li>
								<a
									href="/integrations"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									통합
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 class="mb-4 text-lg font-semibold">지원</h4>
						<ul class="space-y-2">
							<li>
								<a
									href="/docs"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									문서
								</a>
							</li>
							<li>
								<a
									href="/api"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									API 레퍼런스
								</a>
							</li>
							<li>
								<a
									href="/community"
									data-sveltekit-preload-data
									class="text-gray-400 transition-colors duration-200 hover:text-white"
								>
									커뮤니티
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div class="mt-8 border-t border-gray-700 pt-8 text-center">
					<p class="text-gray-400">
						&copy; 2025 FlowAuth. 오픈소스 프로젝트입니다.<br />
						MIT 라이선스 · 자유롭게 사용/기여 환영합니다.
					</p>
				</div>
			</div>
		</footer>
	</div>

	<style>
		/* 홈페이지 전용 스타일만 유지 */
		.animate-on-scroll {
			animation: slide-up 0.8s ease-out;
		}

		/* 그라데이션 텍스트 효과 */
		.bg-clip-text {
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		/* 백드롭 블러 효과 */
		.backdrop-blur-md {
			backdrop-filter: blur(12px);
		}

		.bg-white\/80 {
			background-color: rgba(255, 255, 255, 0.8);
		}

		.bg-white\/60 {
			background-color: rgba(255, 255, 255, 0.6);
		}
	</style>
</div>
