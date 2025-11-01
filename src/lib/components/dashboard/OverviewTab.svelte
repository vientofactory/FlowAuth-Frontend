<script lang="ts">
	import UserInfoCard from './UserInfoCard.svelte';
	import type { User } from '$lib/types/user.types';

	interface Props {
		user: User | null;
		isLoading: boolean;
		onNavigateToProfile: () => void;
	}

	let { user, isLoading, onNavigateToProfile }: Props = $props();
</script>

<div class="space-y-4 sm:space-y-6">
	<UserInfoCard {user} {isLoading} {onNavigateToProfile} />
</div>
