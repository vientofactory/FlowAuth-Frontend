<script lang="ts">
  import { Card, Button, Input } from '$lib';
  import { apiClient } from '$lib';
  import type { LoginData } from '$lib';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let error = $state('');

  async function handleLogin() {
    if (!email || !password) {
      error = '이메일과 비밀번호를 입력해주세요.';
      return;
    }

    isLoading = true;
    error = '';

    try {
      const loginData: LoginData = { email, password };
      const result = await apiClient.login(loginData);

      // 로그인 성공 - 메인 페이지로 리다이렉트
      console.log('Login successful:', result);
      window.location.href = '/dashboard';
    } catch (err) {
      error = err instanceof Error ? err.message : '로그인에 실패했습니다.';
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>로그인 - FlowAuth</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
  <Card class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">FlowAuth</h1>
      <p class="text-gray-600">계정에 로그인하세요</p>
    </div>

    <form onsubmit={handleLogin} class="space-y-6">
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      {/if}

      <Input
        type="email"
        label="이메일"
        placeholder="your@email.com"
        value={email}
        oninput={(e: Event) => email = (e.target as HTMLInputElement).value}
        required
        disabled={isLoading}
      />

      <Input
        type="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
        value={password}
        oninput={(e: Event) => password = (e.target as HTMLInputElement).value}
        required
        disabled={isLoading}
      />

      <Button
        variant="primary"
        type="submit"
        disabled={isLoading}
      >
        {#if isLoading}
          로그인 중...
        {:else}
          로그인
        {/if}
      </Button>
    </form>

    <div class="mt-6 text-center">
      <p class="text-gray-600">
        계정이 없으신가요?
        <a href="/auth/register" class="text-blue-600 hover:text-blue-500 font-medium">
          회원가입
        </a>
      </p>
    </div>

    <div class="mt-4 text-center">
      <a href="/" class="text-gray-500 hover:text-gray-700 text-sm">
        ← 홈으로 돌아가기
      </a>
    </div>
  </Card>
</div>

<style>
</style>