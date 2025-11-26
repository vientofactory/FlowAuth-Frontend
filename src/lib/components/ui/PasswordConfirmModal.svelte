<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import LoadingButton from './LoadingButton.svelte';
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'primary' | 'danger';
		loading?: boolean;
		requirePassword?: boolean;
		passwordLabel?: string;
		passwordPlaceholder?: string;
		passwordError?: string;
		children?: Snippet;
		onConfirm: (password?: string) => void;
		onCancel: () => void;
	}

	let {
		open = false,
		title,
		message,
		confirmText = '확인',
		cancelText = '취소',
		confirmVariant = 'primary',
		loading = false,
		requirePassword = false,
		passwordLabel = '비밀번호 확인',
		passwordPlaceholder = '비밀번호를 입력하세요',
		passwordError = '',
		children,
		onConfirm,
		onCancel
	}: Props = $props();

	let password = $state('');

	const dispatch = createEventDispatcher();

	function handleConfirm() {
		if (requirePassword && !password.trim()) {
			dispatch('passwordError', '비밀번호를 입력해주세요.');
			return;
		}

		if (requirePassword && password.length < 8) {
			dispatch('passwordError', '비밀번호는 최소 8자 이상이어야 합니다.');
			return;
		}

		dispatch('passwordError', ''); // 에러 초기화
		onConfirm(requirePassword ? password : undefined);
	}

	function handleCancel() {
		password = '';
		dispatch('passwordError', '');
		onCancel();
	}

	function handlePasswordInput() {
		dispatch('passwordError', '');
	}

	// 모달이 닫힐 때 상태 초기화
	$effect(() => {
		if (!open) {
			password = '';
			dispatch('passwordError', '');
		}
	});
</script>

<Modal {open} {title} onClose={handleCancel} size="sm">
	<div class="p-4">
		{#if message}
			<p class="mb-4 text-sm leading-relaxed text-gray-600">{message}</p>
		{/if}

		<!-- 커스텀 콘텐츠 -->
		{#if children}
			{@render children()}
		{/if}

		<!-- 비밀번호 입력 필드 -->
		{#if requirePassword}
			<div class="rounded-lg bg-gray-50 p-4">
				<label for="password-confirm" class="mb-2 block text-sm font-medium text-gray-700">
					{passwordLabel}
				</label>
				<input
					id="password-confirm"
					type="password"
					bind:value={password}
					placeholder={passwordPlaceholder}
					class="w-full rounded-md border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none {passwordError
						? 'border-red-300'
						: 'border-gray-300'}"
					required
					oninput={handlePasswordInput}
					disabled={loading}
				/>
				{#if passwordError}
					<p class="mt-1 text-xs text-red-600">
						{passwordError}
					</p>
				{:else}
					<p class="mt-1 text-xs text-gray-600">보안을 위해 비밀번호를 확인합니다.</p>
				{/if}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex justify-end space-x-3 px-6 py-4">
			<Button variant="outline" onclick={handleCancel} disabled={loading}>
				{cancelText}
			</Button>
			<LoadingButton
				variant={confirmVariant}
				{loading}
				onclick={handleConfirm}
				loadingText="처리 중..."
			>
				{confirmText}
			</LoadingButton>
		</div>
	{/snippet}
</Modal>
