<script lang="ts">
	// Footer 컴포넌트 - 모든 페이지에서 일관된 푸터 표시
</script>

<!-- 푸터 -->
<footer class="bg-gray-100 text-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<div class="col-span-1 md:col-span-2">
				<div class="mb-4 flex items-center">
					<img src="/logo_1.png" alt="FlowAuth Logo" class="h-8 w-auto object-contain rounded">
				</div>
				<p class="mb-4 max-w-md text-gray-600">
					오픈소스 OAuth2 인증 시스템으로 애플리케이션의 보안을 강화하세요.
				</p>
				<div class="flex space-x-4">
					<a
						href="https://github.com/vientofactory/FlowAuth"
						class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
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
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
						>
							기능
						</a>
					</li>
					<li>
						<a
							href="/security"
							data-sveltekit-preload-data
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
						>
							보안
						</a>
					</li>
					<li>
						<a
							href="/integrations"
							data-sveltekit-preload-data
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
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
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
						>
							문서
						</a>
					</li>
					<li>
						<a
							href="/api"
							data-sveltekit-preload-data
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
						>
							API 레퍼런스
						</a>
					</li>
					<li>
						<a
							href="/community"
							data-sveltekit-preload-data
							class="text-gray-600 transition-colors duration-200 hover:text-gray-900"
						>
							커뮤니티
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="mt-8 border-t border-gray-300 pt-8 text-center">
			<p class="text-gray-600">
				&copy; 2025 FlowAuth<br />
				MIT 라이선스 · 자유롭게 사용/기여할 수 있습니다.
			</p>
		</div>
	</div>
</footer>
