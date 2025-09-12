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
  <header class="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">FA</span>
          </div>
          <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FlowAuth</h1>
        </div>
        <nav class="hidden md:flex items-center space-x-8">
          <a href="/auth/login" class="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">로그인</a>
          <Button variant="primary" onclick={() => window.location.href = '/auth/register'} class="shadow-md hover:shadow-lg transition-shadow duration-200">
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
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <!-- 히어로 섹션 -->
    <div class="text-center mb-20">
      <div class="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 animate-fade-in">
        <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
        OAuth2 인증 시스템의 새로운 표준
      </div>

      <h2 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        안전하고 <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">현대적인</span><br />
        인증 솔루션
      </h2>

      <p class="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
        JWT 토큰 기반의 강력한 보안 시스템으로<br />
        애플리케이션의 인증을 쉽고 안전하게 관리하세요
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
        <Button variant="primary" onclick={() => window.location.href = '/auth/register'} class="px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200">
          <i class="fas fa-rocket mr-2"></i>
          무료로 시작하기
        </Button>
        <Button variant="outline" onclick={() => window.location.href = '/docs'} class="px-8 py-4 text-lg border-2 hover:bg-blue-50 transition-colors duration-200">
          <i class="fas fa-book mr-2"></i>
          문서 보기
        </Button>
      </div>

      <!-- 통계 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
          <div class="text-gray-600">가동률</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">10ms</div>
          <div class="text-gray-600">평균 응답시간</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">∞</div>
          <div class="text-gray-600">무제한 요청</div>
        </div>
      </div>
    </div>

    <!-- 특징 섹션 -->
    <div class="mb-20">
      <div class="text-center mb-16">
        <h3 class="text-3xl font-bold text-gray-900 mb-4">왜 FlowAuth를 선택해야 할까요?</h3>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          개발자 친화적인 OAuth2 솔루션으로 더 빠르고 안전한 인증을 구현하세요
        </p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <Card class="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i class="fas fa-shield-alt text-2xl text-white"></i>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">
              <i class="fas fa-shield-alt text-blue-600 mr-2"></i>
              군사급 보안
            </h4>
            <p class="text-gray-600 leading-relaxed">
              JWT 토큰과 bcrypt 해싱으로 사용자 데이터를<br />
              최고 수준의 보안으로 보호합니다
            </p>
          </div>
        </Card>

        <Card class="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i class="fas fa-bolt text-2xl text-white"></i>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">
              <i class="fas fa-bolt text-green-600 mr-2"></i>
              번개 같은 속도
            </h4>
            <p class="text-gray-600 leading-relaxed">
              최적화된 아키텍처로 밀리초 단위의<br />
              빠른 인증 응답을 제공합니다
            </p>
          </div>
        </Card>

        <Card class="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i class="fas fa-chart-line text-2xl text-white"></i>
            </div>
            <h4 class="text-xl font-bold text-gray-900 mb-3">
              <i class="fas fa-chart-line text-purple-600 mr-2"></i>
              실시간 모니터링
            </h4>
            <p class="text-gray-600 leading-relaxed">
              상세한 대시보드로 인증 현황을<br />
              실시간으로 모니터링하세요
            </p>
          </div>
        </Card>
      </div>
    </div>

    <!-- API 상태 -->
    <Card class="text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div class="flex items-center justify-center mb-4">
        <div class="w-4 h-4 bg-green-500 rounded-full animate-pulse mr-3"></div>
        <h3 class="text-2xl font-bold text-gray-900">시스템 상태</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white/60 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600 mb-1">99.9%</div>
          <div class="text-sm text-gray-600">가동률</div>
        </div>
        <div class="bg-white/60 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600 mb-1">&lt;50ms</div>
          <div class="text-sm text-gray-600">응답시간</div>
        </div>
        <div class="bg-white/60 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600 mb-1">24/7</div>
          <div class="text-sm text-gray-600">모니터링</div>
        </div>
      </div>
      <p class="text-green-700 font-medium">
        <i class="fas fa-check-circle mr-2"></i>
        모든 시스템이 정상 작동 중입니다
      </p>
    </Card>
  </main>

  <!-- 푸터 -->
  <footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">FA</span>
            </div>
            <span class="text-xl font-bold">FlowAuth</span>
          </div>
          <p class="text-gray-300 mb-4 max-w-md">
            현대적인 OAuth2 인증 시스템으로 애플리케이션의 보안을 강화하세요.
            개발자 친화적인 API로 빠르고 쉽게 통합할 수 있습니다.
          </p>
          <div class="flex space-x-4">
            <a href="https://github.com/vientofactory" class="text-gray-400 hover:text-white transition-colors duration-200" aria-label="GitHub">
              <i class="fab fa-github text-xl"></i>
            </a>
          </div>
        </div>

        <div>
          <h4 class="text-lg font-semibold mb-4">제품</h4>
          <ul class="space-y-2">
            <li><a href="/features" class="text-gray-400 hover:text-white transition-colors duration-200">기능</a></li>
            <li><a href="/security" class="text-gray-400 hover:text-white transition-colors duration-200">보안</a></li>
            <li><a href="/integrations" class="text-gray-400 hover:text-white transition-colors duration-200">통합</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-lg font-semibold mb-4">지원</h4>
          <ul class="space-y-2">
            <li><a href="/docs" class="text-gray-400 hover:text-white transition-colors duration-200">문서</a></li>
            <li><a href="/api" class="text-gray-400 hover:text-white transition-colors duration-200">API 레퍼런스</a></li>
            <li><a href="/community" class="text-gray-400 hover:text-white transition-colors duration-200">커뮤니티</a></li>
          </ul>
        </div>
      </div>

      <div class="border-t border-gray-700 mt-8 pt-8 text-center">
        <p class="text-gray-400">&copy; 2025 FlowAuth. 모든 권리 보유.</p>
      </div>
    </div>
  </footer>
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }

  /* 스크롤 기반 애니메이션 */
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

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