<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { Client } from '$lib/types/oauth.types';
	import type { PageData } from './$types';

	export let data: PageData;

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
		// Parameters are already extracted from +page.ts
		const { authorizeParams } = data;

		if (
			!authorizeParams.client_id ||
			!authorizeParams.redirect_uri ||
			!authorizeParams.response_type
		) {
			error = '필수 OAuth2 파라미터가 누락되었습니다';
			loading = false;
			return;
		}

		try {
			// 디버그 정보 출력
			apiClient.debugToken();

			// Get consent information from backend using API client
			const params = new URLSearchParams({
				client_id: authorizeParams.client_id,
				redirect_uri: authorizeParams.redirect_uri,
				response_type: authorizeParams.response_type,
				...(authorizeParams.scope && { scope: authorizeParams.scope }),
				...(authorizeParams.state && { state: authorizeParams.state }),
				...(authorizeParams.code_challenge && { code_challenge: authorizeParams.code_challenge }),
				...(authorizeParams.code_challenge_method && {
					code_challenge_method: authorizeParams.code_challenge_method
				})
			});

			const result = await apiClient.request<{ client: Client; scopes: string[] }>(
				`/oauth2/authorize/info?${params.toString()}`,
				{ method: 'GET' }
			);

			client = result.client;
			requestedScopes = result.scopes;
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
				...data.authorizeParams,
				approved
			};

			const result = await apiClient.request<{ redirect_url: string }>(
				'/oauth2/authorize/consent',
				{
					method: 'POST',
					body: JSON.stringify(consentData)
				}
			);

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

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4"
>
	<div class="w-full max-w-md">
		{#if loading}
			<Card class="text-center">
				<Loading />
				<p class="mt-4 text-gray-600">인가 요청을 검증 중입니다...</p>
			</Card>
		{:else if error}
			<Card class="text-center">
				<div class="mb-4 text-red-500">
					<i class="fas fa-exclamation-triangle text-3xl"></i>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">인가 오류</h2>
				<p class="mb-4 text-gray-600">{error}</p>
				<Button variant="secondary" onclick={() => window.history.back()}>
					<i class="fas fa-arrow-left mr-2"></i>
					뒤로 가기
				</Button>
			</Card>
		{:else if client}
			<Card>
				<div class="mb-6 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100"
					>
						<i class="fas fa-shield-alt text-2xl text-indigo-600"></i>
					</div>
					<h1 class="mb-2 text-2xl font-bold text-gray-900">애플리케이션 인가</h1>
					<p class="text-gray-600">
						<strong>{client.name}</strong>이(가) 귀하의 FlowAuth 계정에 액세스하려고 합니다
					</p>
				</div>

				{#if client.description}
					<div class="mb-6 rounded-lg bg-gray-50 p-4">
						<h3 class="mb-2 font-medium text-gray-900">이 애플리케이션에 대해</h3>
						<p class="text-sm text-gray-600">{client.description}</p>
					</div>
				{/if}

				{#if requestedScopes.length > 0}
					<div class="mb-6">
						<h3 class="mb-3 font-medium text-gray-900">
							<i class="fas fa-key mr-2"></i>
							요청된 권한
						</h3>
						<div class="space-y-2">
							{#each requestedScopes as scopeName (scopeName)}
								<div class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
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

				<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
					<div class="flex">
						<i class="fas fa-info-circle mt-0.5 mr-3 text-amber-500"></i>
						<div class="text-sm text-amber-800">
							<p class="mb-1 font-medium">중요:</p>
							<p>
								이 애플리케이션을 인가하면 요청된 권한으로 계정에 액세스할 수 있습니다. 계정
								설정에서 언제든지 이 액세스를 취소할 수 있습니다.
							</p>
						</div>
					</div>
				</div>

				<div class="flex space-x-3">
					<Button variant="secondary" class="flex-1" onclick={handleDeny} disabled={submitting}>
						{#if submitting}
							<Loading size="sm" />
						{:else}
							<i class="fas fa-times mr-2"></i>
						{/if}
						거부
					</Button>
					<Button variant="primary" class="flex-1" onclick={handleApprove} disabled={submitting}>
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
