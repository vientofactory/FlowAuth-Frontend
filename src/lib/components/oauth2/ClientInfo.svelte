<script lang="ts">
	import type { Client } from '$lib/types/oauth.types';

	export let client: Client;
</script>

{#if client.description}
	<div
		class="mb-4 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 shadow-sm sm:mb-6 sm:rounded-xl"
	>
		<div class="flex items-start space-x-2 sm:space-x-3">
			<div class="flex-shrink-0">
				<div
					class="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 sm:h-8 sm:w-8 sm:rounded-lg"
				>
					<i class="fas fa-info-circle text-sm text-blue-600" aria-hidden="true"></i>
				</div>
			</div>
			<div>
				<h3 class="mb-1 text-sm font-semibold text-gray-900 sm:mb-2 sm:text-base">
					애플리케이션 정보
				</h3>
				<p class="text-xs leading-relaxed text-gray-700 sm:text-sm">{client.description}</p>
			</div>
		</div>
	</div>
{/if}
