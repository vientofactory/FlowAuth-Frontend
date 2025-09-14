<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createApiUrl } from '$lib/config/env';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { Client } from '$lib/types/oauth.types';

	// OAuth parameters from URL
	let client_id = '';
	let redirect_uri = '';
	let response_type = '';
	let scope = '';
	let state = '';
	let code_challenge = '';
	let code_challenge_method = '';

	// Component state
	let loading = true;
	let submitting = false;
	let error = '';
	let client: Client | null = null;
	let requestedScopes: string[] = [];

	// Scope descriptions
	const scopeDescriptions: Record<string, string> = {
		read: '기본 정보에 대한 읽기 권한',
		write: '계정 데이터 수정 권한',
		profile: '프로필 정보 접근 권한',
		email: '이메일 주소 접근 권한',
		openid: 'OpenID Connect 인증',
		offline_access: '로그인 상태 유지 (리프레시 토큰)'
	};

	onMount(async () => {
		// Extract parameters from URL
		const params = $page.url.searchParams;
		client_id = params.get('client_id') || '';
		redirect_uri = params.get('redirect_uri') || '';
		response_type = params.get('response_type') || '';
		scope = params.get('scope') || '';
		state = params.get('state') || '';
		code_challenge = params.get('code_challenge') || '';
		code_challenge_method = params.get('code_challenge_method') || '';

		if (!client_id || !redirect_uri || !response_type) {
			error = '필수 OAuth2 파라미터가 누락되었습니다';
			loading = false;
			return;
		}

		try {
			// Validate authorization request
			const response = await fetch(createApiUrl(`/oauth/authorize?${params.toString()}`), {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error_description || '인가 요청 검증에 실패했습니다');
			}

			const data = await response.json();
			client = data.client;
			requestedScopes = data.scopes;
		} catch (err) {
			console.error('Authorization validation error:', err);
			error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
		} finally {
			loading = false;
		}
	});

	async function handleConsent(approved: boolean) {
		if (submitting) return;
		
		submitting = true;
		error = '';

		try {
			const consentData = {
				client_id,
				redirect_uri,
				response_type,
				scope,
				state,
				code_challenge,
				code_challenge_method,
				approved
			};

			const response = await fetch(createApiUrl('/oauth/authorize/consent'), {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(consentData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error_description || 'Consent processing failed');
			}

			const result = await response.json();
			
			// Redirect to the client application
			window.location.href = result.redirect_url;
		} catch (err) {
			console.error('Consent error:', err);
			error = err instanceof Error ? err.message : '동의 처리 중 오류가 발생했습니다';
		} finally {
			submitting = false;
		}
	}

	function handleApprove() {
		handleConsent(true);
	}

	function handleDeny() {
		handleConsent(false);
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		{#if loading}
			<Card class="text-center">
				<Loading />
				<p class="mt-4 text-gray-600">인가 요청을 검증 중입니다...</p>
			</Card>
		{:else if error}
			<Card class="text-center">
				<div class="text-red-500 mb-4">
					<i class="fas fa-exclamation-triangle text-3xl"></i>
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">인가 오류</h2>
				<p class="text-gray-600 mb-4">{error}</p>
				<Button variant="secondary" onclick={() => window.history.back()}>
					<i class="fas fa-arrow-left mr-2"></i>
					뒤로 가기
				</Button>
			</Card>
		{:else if client}
			<Card>
				<div class="text-center mb-6">
					<div class="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
						<i class="fas fa-shield-alt text-2xl text-indigo-600"></i>
					</div>
					<h1 class="text-2xl font-bold text-gray-900 mb-2">애플리케이션 인가</h1>
					<p class="text-gray-600">
						<strong>{client.name}</strong>이(가) 귀하의 FlowAuth 계정에 액세스하려고 합니다
					</p>
				</div>

				{#if client.description}
					<div class="bg-gray-50 rounded-lg p-4 mb-6">
						<h3 class="font-medium text-gray-900 mb-2">이 애플리케이션에 대해</h3>
						<p class="text-gray-600 text-sm">{client.description}</p>
					</div>
				{/if}

				{#if requestedScopes.length > 0}
					<div class="mb-6">
						<h3 class="font-medium text-gray-900 mb-3">
							<i class="fas fa-key mr-2"></i>
							요청된 권한
						</h3>
						<div class="space-y-2">
							{#each requestedScopes as scopeName}
								<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
									<i class="fas fa-check text-green-500"></i>
									<div>
										<div class="font-medium text-gray-900">{scopeName}</div>
										<div class="text-sm text-gray-600">
											{scopeDescriptions[scopeName] || `Access to ${scopeName} scope`}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
					<div class="flex">
						<i class="fas fa-info-circle text-amber-500 mt-0.5 mr-3"></i>
						<div class="text-sm text-amber-800">
							<p class="font-medium mb-1">중요:</p>
							<p>이 애플리케이션을 인가하면 요청된 권한으로 계정에 액세스할 수 있습니다. 계정 설정에서 언제든지 이 액세스를 취소할 수 있습니다.</p>
						</div>
					</div>
				</div>

				<div class="flex space-x-3">
					<Button 
						variant="secondary" 
						class="flex-1" 
						onclick={handleDeny}
						disabled={submitting}
					>
						{#if submitting}
							<Loading size="sm" />
						{:else}
							<i class="fas fa-times mr-2"></i>
						{/if}
						거부
					</Button>
					<Button 
						variant="primary" 
						class="flex-1" 
						onclick={handleApprove}
						disabled={submitting}
					>
						{#if submitting}
							<Loading size="sm" />
						{:else}
							<i class="fas fa-check mr-2"></i>
						{/if}
						인가
					</Button>
				</div>

				<div class="mt-4 text-center">
					<p class="text-xs text-gray-500">
						Powered by <strong>FlowAuth</strong> • 
						<a href="/privacy" class="underline hover:text-gray-700">개인정보 처리방침</a>
					</p>
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>