<script lang="ts">
	import { LoadingButton, apiClient, useToast } from '$lib';
	import type { User } from '$lib';
	import { createEventDispatcher } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faTimes,
		faExclamationTriangle,
		faSpinner,
		faPaperPlane
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		user: User;
		onDismiss?: () => void;
	}

	let { user, onDismiss }: Props = $props();

	let isResending = $state(false);
	let dismissed = $state(false);

	const toast = useToast();
	const dispatch = createEventDispatcher();

	async function resendVerification() {
		if (isResending || !user?.email) return;

		try {
			isResending = true;
			await apiClient.auth.resendVerificationEmail(user.email);
			toast.success('인증 이메일이 전송되었습니다. 이메일함을 확인해주세요.');
		} catch (error) {
			console.error('Failed to resend verification email:', error);
			toast.error('이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
		} finally {
			isResending = false;
		}
	}

	function handleDismiss() {
		dismissed = true;
		if (onDismiss) {
			onDismiss();
		}
		dispatch('dismiss');
	}

	// 이미 인증되었거나 사용자가 dismiss한 경우 표시하지 않음
	const shouldShow = $derived(!dismissed && user && !user.isEmailVerified);
</script>

{#if shouldShow}
	<div
		class="animate-fade-in relative mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm"
		role="alert"
		aria-live="polite"
	>
		<!-- 닫기 버튼 -->
		<button
			onclick={handleDismiss}
			class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800"
			aria-label="알림 닫기"
		>
			<FontAwesomeIcon icon={faTimes} class="text-sm" />
		</button>

		<div class="flex items-start space-x-3 pr-8">
			<!-- 경고 아이콘 -->
			<div class="flex h-6 w-6 shrink-0 items-center justify-center">
				<FontAwesomeIcon icon={faExclamationTriangle} class="text-amber-600" />
			</div>

			<!-- 메시지 콘텐츠 -->
			<div class="flex-1">
				<h3 class="mb-1 text-sm font-semibold text-amber-800">이메일 주소 인증이 필요합니다</h3>
				<p class="mb-3 text-sm text-amber-700">
					계정 보안을 위해 이메일 주소 인증을 완료해주세요.
					<span class="font-medium">{user.email}</span>로 인증 이메일을 발송했습니다.
				</p>

				<!-- 액션 버튼들 -->
				<div class="flex flex-col gap-2 sm:flex-row">
					<LoadingButton
						variant="outline"
						size="sm"
						onclick={resendVerification}
						loading={isResending}
						class="border-amber-300 bg-white text-amber-700 shadow-sm hover:border-amber-400 hover:bg-amber-50 focus:ring-amber-500"
					>
						{#if isResending}
							<FontAwesomeIcon icon={faSpinner} class="mr-2 animate-spin" />
							전송 중...
						{:else}
							<FontAwesomeIcon icon={faPaperPlane} class="mr-2" />
							인증 이메일 재전송
						{/if}
					</LoadingButton>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
