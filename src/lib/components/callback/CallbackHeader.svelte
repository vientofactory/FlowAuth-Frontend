<script lang="ts">
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';

	interface Props {
		onNavigateBack: () => void;
		onGoToDashboard: () => void;
	}

	let { onNavigateBack, onGoToDashboard }: Props = $props();
</script>

<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex items-center space-x-4">
				<Button
					variant="outline"
					size="sm"
					onclick={onNavigateBack}
					class="text-gray-600 hover:text-gray-900"
				>
					<FontAwesomeIcon icon={faArrowLeft} class="mr-2" />
					OAuth2 테스터로
				</Button>
				<div class="h-6 w-px bg-gray-300"></div>
				<h1 class="text-xl font-semibold text-gray-900">OAuth2 콜백</h1>
			</div>
			<div class="flex items-center space-x-4">
				<Button
					variant="outline"
					size="sm"
					onclick={onGoToDashboard}
					class="border-gray-300 text-gray-700 hover:bg-gray-50"
				>
					<FontAwesomeIcon icon={faHome} class="mr-2" />
					대시보드로
				</Button>
			</div>
		</div>
	</div>
</header>
