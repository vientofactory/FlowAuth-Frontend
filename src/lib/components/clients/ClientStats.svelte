<script lang="ts">
	import { Card } from '$lib';
	import type { Client } from '$lib/types/oauth.types';

	interface Props {
		clients: Client[];
	}

	let { clients }: Props = $props();
</script>

<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<!-- 총 클라이언트 -->
	<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm ring-1 ring-blue-100 transition-all duration-200 hover:shadow-md">
		<div class="relative flex items-center">
			<div class="flex-shrink-0">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
					<i class="fas fa-users text-lg text-blue-600"></i>
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">총 클라이언트</p>
				<p class="text-2xl font-bold text-gray-900">{clients.length}</p>
			</div>
		</div>
	</div>

	<!-- 활성 클라이언트 -->
	<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm ring-1 ring-green-100 transition-all duration-200 hover:shadow-md">
		<div class="relative flex items-center">
			<div class="flex-shrink-0">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100">
					<i class="fas fa-check-circle text-lg text-green-600"></i>
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
	<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm ring-1 ring-red-100 transition-all duration-200 hover:shadow-md">
		<div class="relative flex items-center">
			<div class="flex-shrink-0">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-rose-100">
					<i class="fas fa-times-circle text-lg text-red-600"></i>
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
	<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 p-4 shadow-sm ring-1 ring-purple-100 transition-all duration-200 hover:shadow-md">
		<div class="relative flex items-center">
			<div class="flex-shrink-0">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-violet-100">
					<i class="fas fa-shield-alt text-lg text-purple-600"></i>
				</div>
			</div>
			<div class="ml-3 flex-1">
				<p class="text-sm font-medium text-gray-600">평균 스코프 수</p>
				<p class="text-2xl font-bold text-gray-900">
					{clients.length > 0
						? Math.round(clients.reduce((sum, c) => sum + (c.scopes?.length || 0), 0) / clients.length)
						: 0}
				</p>
			</div>
		</div>
	</div>
</div>
