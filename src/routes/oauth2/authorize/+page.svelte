<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import LoadingState from '$lib/components/oauth2/LoadingState.svelte';
	import ErrorState from '$lib/components/oauth2/ErrorState.svelte';
	import AuthorizationHeader from '$lib/components/oauth2/AuthorizationHeader.svelte';
	import ClientInfo from '$lib/components/oauth2/ClientInfo.svelte';
	import ScopeList from '$lib/components/oauth2/ScopeList.svelte';
	import SecurityNotice from '$lib/components/oauth2/SecurityNotice.svelte';
	import AuthorizationFooter from '$lib/components/oauth2/AuthorizationFooter.svelte';
	import { useAuthorization } from '$lib/hooks/useAuthorization';
	import type { AuthorizationState } from '$lib/types/authorization.types';
	import type { PageData } from './$types';

	export let data: PageData;

	// 권한 부여 훅 사용
	const { state, handleConsent, retryAuthorization } = useAuthorization(data);

	// 상태 구독
	let currentState: AuthorizationState;
	const unsubscribe = state.subscribe((value) => {
		currentState = value;
	});

	onMount(() => {
		return unsubscribe;
	});

	// 이벤트 핸들러
	function handleApprove() {
		handleConsent(true);
	}

	function handleDeny() {
		handleConsent(false);
	}

	function handleRetry() {
		retryAuthorization();
	}

	function handleGoBack() {
		window.history.back();
	}
</script>

<svelte:head>
	<title>Authorize Application - FlowAuth</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4"
	role="main"
	aria-labelledby="authorize-heading"
>
	<div
		class="flex h-auto max-h-[90vh] w-full max-w-lg items-center sm:max-h-[85vh] md:max-h-[80vh] lg:max-h-[75vh]"
	>
		{#if currentState?.loading}
			<Card class="oauth-card w-full shadow-2xl">
				<LoadingState
					message="인가 요청을 확인하고 있습니다..."
					progress={currentState.loadingProgress}
				/>
			</Card>
		{:else if currentState?.error}
			<Card class="oauth-card w-full border-red-200 shadow-2xl">
				<ErrorState error={currentState.error} onRetry={handleRetry} onGoBack={handleGoBack} />
			</Card>
		{:else if currentState?.client}
			<Card
				class="oauth-card flex h-full w-full flex-col overflow-hidden border-0 bg-white/90 shadow-2xl backdrop-blur-sm"
			>
				<AuthorizationHeader client={currentState.client} />

				<!-- Scrollable Content Area -->
				<div class="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
					<ClientInfo client={currentState.client} />
					<ScopeList scopes={currentState.scopes} />
					<SecurityNotice />
				</div>

				<AuthorizationFooter
					submitting={currentState.submitting}
					onApprove={handleApprove}
					onDeny={handleDeny}
				/>
			</Card>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	/* Smooth animations */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	/* Apply animations to main elements */
	:global(.oauth-card) {
		animation: fadeInUp 0.6s ease-out;
	}

	/* Enhanced button hover effects */
	:global(.oauth-button) {
		position: relative;
		overflow: hidden;
	}

	:global(.oauth-button::before) {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	:global(.oauth-button:hover::before) {
		left: 100%;
	}

	/* Gradient text animation */
	@keyframes gradientShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	/* Card hover effects */
	:global(.permission-card) {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.permission-card:hover) {
		transform: translateY(-2px);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	/* Mobile optimizations */
	@media (max-width: 640px) {
		/* Improve touch scrolling */
		:global(.overflow-y-auto) {
			-webkit-overflow-scrolling: touch;
			scroll-behavior: smooth;
		}

		/* Better button touch targets */
		:global(.oauth-button) {
			min-height: 44px; /* iOS recommended touch target size */
			touch-action: manipulation;
		}

		/* Reduce motion for mobile performance */
		:global(.oauth-card) {
			animation-duration: 0.3s;
		}

		/* Optimize spacing for mobile */
		:global(.permission-card) {
			margin-bottom: 0.5rem;
		}

		/* Better text readability on mobile */
		:global(.text-xs) {
			line-height: 1.4;
		}
	}

	/* Tablet optimizations */
	@media (min-width: 641px) and (max-width: 1024px) {
		:global(.oauth-card) {
			max-width: 90vw;
		}
	}

	/* Desktop optimizations */
	@media (min-width: 1025px) {
		:global(.oauth-card) {
			max-width: 480px;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(.oauth-card) {
			border: 2px solid;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(.oauth-card),
		:global(.oauth-button) :global(.oauth-button) {
			transition: none;
		}
	}

	/* Safe area support for notched devices */
	@supports (padding: max(0px)) {
		:global(.oauth-card) {
			padding-left: max(1rem, env(safe-area-inset-left));
			padding-right: max(1rem, env(safe-area-inset-right));
		}
	}
</style>
