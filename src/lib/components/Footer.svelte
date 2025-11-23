<script lang="ts">
	// Footer 컴포넌트 - 모든 페이지에서 일관된 푸터 표시
	import { env } from '$lib/config/env';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faGithub } from '@fortawesome/free-brands-svg-icons';
</script>

<!-- 푸터 -->
<footer class="relative z-10 bg-stone-100 text-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<div class="col-span-1 md:col-span-2">
				<div class="mb-4 flex items-center">
					<img src="/logo_1.png" alt="FlowAuth Logo" class="h-8 w-auto rounded object-contain" />
				</div>
				<p class="mb-4 max-w-md text-stone-600">
					오픈소스 통합 인증 시스템으로 애플리케이션의 보안을 강화하세요.
				</p>
				<div class="flex space-x-4">
					<a
						href="https://github.com/vientofactory/FlowAuth"
						class="text-stone-600 transition-colors duration-200 hover:text-stone-900"
						aria-label="GitHub"
					>
						<FontAwesomeIcon icon={faGithub} class="text-xl" />
					</a>
				</div>
			</div>

			<div>
				<h4 class="mb-4 text-lg font-semibold">지원</h4>
				<ul class="space-y-2">
					<li>
						<a
							href="https://op0.gitbook.io/flowauth"
							data-sveltekit-preload-data
							class="text-stone-600 transition-colors duration-200 hover:text-stone-900"
						>
							문서
						</a>
					</li>
					<li>
						<a
							href="https://op0.gitbook.io/flowauth/reference/flowauth-oauth2-authentication-system"
							data-sveltekit-preload-data
							class="text-stone-600 transition-colors duration-200 hover:text-stone-900"
						>
							API 레퍼런스
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="mt-8 border-t border-stone-300 pt-8 text-center">
			<p class="text-stone-600">
				&copy; 2025 FlowAuth<br />
				MIT 라이선스 · 자유롭게 사용/기여할 수 있습니다.
			</p>

			<!-- Google reCAPTCHA 약관 표시 -->
			{#if env.RECAPTCHA_SITE_KEY}
				<p class="mt-4 text-xs text-neutral-500">
					This site is protected by reCAPTCHA and the Google
					<a
						href="https://policies.google.com/privacy"
						target="_blank"
						rel="noopener noreferrer"
						class="text-stone-600 underline hover:text-stone-800"
					>
						Privacy Policy
					</a>
					and
					<a
						href="https://policies.google.com/terms"
						target="_blank"
						rel="noopener noreferrer"
						class="text-stone-600 underline hover:text-stone-800"
					>
						Terms of Service
					</a>
					apply.
				</p>
			{/if}
		</div>
	</div>
</footer>
