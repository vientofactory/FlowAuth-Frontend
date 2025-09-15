<script lang="ts">
	import { Card, Button, Navigation } from '$lib';
	import Footer from '$lib/components/Footer.svelte';
	import { STYLE_CONSTANTS } from '$lib/constants/app.constants';
	import { goto } from '$app/navigation';
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
						onclick={() => goto('/auth/register')}
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
		<Footer />
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
