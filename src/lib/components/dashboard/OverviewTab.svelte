<script lang="ts">
	import UserInfoCard from './UserInfoCard.svelte';
	import EmailSystemStatus from './EmailSystemStatus.svelte';
	import { usePermissions } from '$lib/composables/usePermissions';
	import type { User } from '$lib/types/user.types';

	interface Props {
		user: User | null;
		isLoading: boolean;
		onNavigateToProfile: () => void;
	}

	let { user, isLoading, onNavigateToProfile }: Props = $props();

	// 시스템 관리 권한 체크
	const { canManageSystem } = usePermissions();
</script>

<div class="space-y-4 sm:space-y-6">
	<UserInfoCard {user} {isLoading} {onNavigateToProfile} />

	<!-- 시스템 관리자만 이메일 시스템 상태 표시 -->
	{#if $canManageSystem && !isLoading}
		<EmailSystemStatus />
	{/if}
</div>
