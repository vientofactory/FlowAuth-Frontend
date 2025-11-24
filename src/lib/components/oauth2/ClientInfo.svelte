<script lang="ts">
	import type { Client } from '$lib/types/oauth.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faInfoCircle,
		faFileContract,
		faExternalLinkAlt
	} from '@fortawesome/free-solid-svg-icons';

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
					<span aria-hidden="true"
						><FontAwesomeIcon icon={faInfoCircle} class="text-sm text-blue-600" /></span
					>
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

<!-- 정책 링크들 -->
{#if client.termsOfServiceUri || client.policyUri}
	<div
		class="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3 shadow-sm sm:mb-6 sm:rounded-xl"
	>
		<div class="flex items-start space-x-2 sm:space-x-3">
			<div class="flex-shrink-0">
				<div
					class="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 sm:h-8 sm:w-8 sm:rounded-lg"
				>
					<span aria-hidden="true"
						><FontAwesomeIcon icon={faFileContract} class="text-sm text-gray-600" /></span
					>
				</div>
			</div>
			<div class="flex-1">
				<h3 class="mb-2 text-sm font-semibold text-gray-900 sm:text-base">정책 및 약관</h3>
				<div class="flex flex-wrap gap-2 sm:gap-3">
					{#if client.termsOfServiceUri}
						<a
							href={client.termsOfServiceUri}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900 sm:px-3 sm:py-1.5 sm:text-sm"
						>
							<span aria-hidden="true"
								><FontAwesomeIcon icon={faExternalLinkAlt} class="mr-1" /></span
							>
							이용약관
						</a>
					{/if}
					{#if client.policyUri}
						<a
							href={client.policyUri}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900 sm:px-3 sm:py-1.5 sm:text-sm"
						>
							<span aria-hidden="true"
								><FontAwesomeIcon icon={faExternalLinkAlt} class="mr-1" /></span
							>
							개인정보처리방침
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
