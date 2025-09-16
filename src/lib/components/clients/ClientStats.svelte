<script lang="ts">
	import { Card } from '$lib';
	import type { Client } from '$lib/types/oauth.types';

	interface Props {
		clients: Client[];
	}

	let { clients }: Props = $props();
</script>

<div class="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-2 lg:grid-cols-4">
	<Card class="p-3 sm:p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 sm:h-10 sm:w-10"
				>
					<i class="fas fa-users text-lg text-blue-600 sm:text-xl"></i>
				</div>
			</div>
			<div class="ml-2 flex-1 sm:ml-3">
				<p class="text-xs font-medium text-gray-500 sm:text-sm">총 클라이언트</p>
				<p class="text-lg font-bold text-gray-900 sm:text-xl">{clients.length}</p>
			</div>
		</div>
	</Card>

	<Card class="p-3 sm:p-4">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:h-10 sm:w-10"
				>
					<i class="fas fa-check-circle text-lg text-green-600 sm:text-xl"></i>
				</div>
			</div>
			<div class="ml-2 flex-1 sm:ml-3">
				<p class="text-xs font-medium text-gray-500 sm:text-sm">활성 클라이언트</p>
				<p class="text-lg font-bold text-gray-900 sm:text-xl">
					{clients.filter((c) => c.isActive).length}
				</p>
			</div>
		</div>
	</Card>
</div>