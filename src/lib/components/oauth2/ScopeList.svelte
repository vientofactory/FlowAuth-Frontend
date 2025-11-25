<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faKey, faCheck } from '@fortawesome/free-solid-svg-icons';

	export let scopes: string[];
</script>

{#if scopes.length > 0}
	<div class="mb-4 sm:mb-6">
		<div class="mb-2 flex items-center sm:mb-3">
			<FontAwesomeIcon icon={faKey} class="mr-1 text-lg text-indigo-600 sm:mr-2 sm:text-xl" />
			<h3 class="text-base font-bold text-gray-900 sm:text-lg">요청된 권한</h3>
		</div>

		<ul class="space-y-2 sm:space-y-3" role="list" aria-label="요청된 권한 목록">
			{#each scopes as scopeName (scopeName)}
				<li
					class="group permission-card flex items-start space-x-2 rounded-md border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md sm:space-x-3 sm:rounded-lg sm:p-3"
					role="listitem"
					aria-describedby="scope-{scopeName}-desc"
				>
					<div class="shrink-0">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-md bg-linear-to-r from-indigo-500 to-purple-600 shadow-sm sm:h-8 sm:w-8"
						>
							<FontAwesomeIcon icon={faKey} class="text-xs text-white" />
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<div class="mb-0.5 flex items-center space-x-1.5 sm:mb-1 sm:space-x-2">
							<h4 class="text-xs font-semibold text-gray-900 sm:text-sm">{scopeName}</h4>
						</div>
						<p class="text-xs leading-relaxed text-gray-600" id="scope-{scopeName}-desc">
							앱이 {scopeName} 권한을 사용할 수 있습니다
						</p>
					</div>

					<div class="shrink-0">
						<div
							class="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 sm:h-5 sm:w-5"
						>
							<FontAwesomeIcon icon={faCheck} class="text-xs text-green-600" />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
{/if}
