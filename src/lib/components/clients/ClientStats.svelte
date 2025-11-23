<script lang="ts">
	import type { Client } from '$lib/types/oauth.types';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faUsers,
		faCheckCircle,
		faTimesCircle,
		faShieldAlt
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		clients: Client[];
	}

	let { clients }: Props = $props();
</script>

<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<!-- 총 클라이언트 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-4 shadow-sm ring-1 ring-stone-100 transition-all duration-200 hover:shadow-md"
	>
		<div class="relative flex items-center">
			<div class="shrink-0">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-stone-100 to-gray-100"
				>
					<FontAwesomeIcon icon={faUsers} class="text-lg text-stone-600" />
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">총 클라이언트</p>
				<p class="text-2xl font-bold text-gray-900">{clients.length}</p>
			</div>
		</div>
	</div>

	<!-- 활성 클라이언트 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-neutral-50 to-slate-50 p-4 shadow-sm ring-1 ring-neutral-100 transition-all duration-200 hover:shadow-md"
	>
		<div class="relative flex items-center">
			<div class="shrink-0">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-neutral-100 to-slate-100"
				>
					<FontAwesomeIcon icon={faCheckCircle} class="text-lg text-neutral-600" />
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">활성 클라이언트</p>
				<p class="text-2xl font-bold text-gray-900">
					{clients.filter((c) => c.isActive).length}
				</p>
			</div>
		</div>
	</div>

	<!-- 비활성 클라이언트 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-gray-50 to-zinc-50 p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:shadow-md"
	>
		<div class="relative flex items-center">
			<div class="shrink-0">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-gray-100 to-zinc-100"
				>
					<FontAwesomeIcon icon={faTimesCircle} class="text-lg text-gray-600" />
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">비활성 클라이언트</p>
				<p class="text-2xl font-bold text-gray-900">
					{clients.filter((c) => !c.isActive).length}
				</p>
			</div>
		</div>
	</div>

	<!-- 평균 스코프 수 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-slate-50 to-stone-50 p-4 shadow-sm ring-1 ring-slate-100 transition-all duration-200 hover:shadow-md"
	>
		<div class="relative flex items-center">
			<div class="shrink-0">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-100 to-stone-100"
				>
					<FontAwesomeIcon icon={faShieldAlt} class="text-lg text-slate-600" />
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">평균 스코프 수</p>
				<p class="text-2xl font-bold text-gray-900">
					{clients.length > 0
						? Math.round(
								clients.reduce((sum, c) => sum + (c.scopes?.length || 0), 0) / clients.length
							)
						: 0}
				</p>
			</div>
		</div>
	</div>
</div>
