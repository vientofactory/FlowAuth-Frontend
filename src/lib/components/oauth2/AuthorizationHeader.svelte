<script lang="ts">
	import type { Client } from '$lib/types/oauth.types';

	export let client: Client;
</script>

<div class="flex-shrink-0 border-b border-gray-100 p-4 pb-3 sm:p-6 sm:pb-4" role="banner">
	<div class="text-center">
		<div class="relative mb-3 sm:mb-4">
			<div class="absolute inset-0 flex items-center justify-center">
				<div
					class="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-xl sm:h-20 sm:w-20"
				></div>
			</div>
			<div
				class="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg sm:h-20 sm:w-20"
			>
				<i class="fas fa-shield-alt text-2xl text-indigo-600 sm:text-3xl" aria-hidden="true"></i>
			</div>
		</div>

		<h1
			class="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent sm:mb-3 sm:text-2xl"
			id="authorize-heading"
		>
			애플리케이션 인가
		</h1>

		<div class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 sm:px-3 sm:py-1.5">
			<p class="text-xs font-medium text-indigo-800 sm:text-sm">
				<strong class="text-indigo-900">{client.name}</strong>이(가) 액세스를 요청합니다
			</p>
		</div>
	</div>
</div>
