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
		<main class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
			<!-- 히어로 섹션 -->
			<div class="mb-12 text-center sm:mb-16 lg:mb-20">
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
			</div>

			<!-- 특징 섹션 -->
			<div class="mb-12 sm:mb-16 lg:mb-20">
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

		/* 반응형 개선을 위한 추가 스타일 */
		@media (max-width: 640px) {
			/* 모바일에서 텍스트 크기 조정 */
			.text-3xl {
				font-size: 1.75rem;
				line-height: 2rem;
			}

			/* 모바일에서 카드 간격 조정 */
			.gap-6 {
				gap: 1rem;
			}

			/* 모바일에서 섹션 마진 조정 */
			.mb-12 {
				margin-bottom: 2rem;
			}

			.mb-8 {
				margin-bottom: 1.5rem;
			}
		}

		@media (min-width: 641px) and (max-width: 1023px) {
			/* 태블릿에서 그리드 조정 */
			.sm\\:grid-cols-2 {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		@media (min-width: 1024px) {
			/* 데스크톱에서 더 큰 그리드 */
			.lg\\:grid-cols-3 {
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
		}

		@media (min-width: 1280px) {
			/* 초대형 화면에서 4열 그리드 */
			.xl\\:grid-cols-4 {
				grid-template-columns: repeat(4, minmax(0, 1fr));
			}
		}

		/* 터치 디바이스 최적화 */
		@media (hover: none) and (pointer: coarse) {
			/* 터치 디바이스에서 호버 효과 제거 */
			.group:hover .group-hover\\:scale-110 {
				transform: scale(1);
			}

			.hover\\:-translate-y-1:hover {
				transform: translateY(0);
			}

			.hover\\:-translate-y-2:hover {
				transform: translateY(0);
			}
		}

		/* 고해상도 디스플레이 지원 */
		@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
			/* 고해상도에서 더 부드러운 효과 */
			.backdrop-blur-md {
				backdrop-filter: blur(16px);
			}
		}
	</style>
</div>
