<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T;
		label: string;
		sortable?: boolean;
		render?: (value: unknown, row: T) => string;
	}

	interface TableProps<T> {
		data: T[];
		columns: Column<T>[];
		loading?: boolean;
		emptyMessage?: string;
		class?: string;
		cell?: Snippet<[{ column: Column<T>; row: T }]>;
		mobileCard?: Snippet<[{ row: T; columns: Column<T>[] }]>;
	}

	let {
		data = [],
		columns = [],
		loading = false,
		emptyMessage = '데이터가 없습니다.',
		class: className = '',
		cell,
		mobileCard
	}: TableProps<T> = $props();

	let sortColumn = $state<keyof T | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// 정렬된 데이터
	let sortedData = $derived.by(() => {
		if (!sortColumn) return data;

		return [...data].sort((a, b) => {
			const aVal = a[sortColumn as keyof T];
			const bVal = b[sortColumn as keyof T];

			if (aVal === bVal) return 0;

			let comparison = 0;
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				comparison = aVal.localeCompare(bVal);
			} else if (typeof aVal === 'number' && typeof bVal === 'number') {
				comparison = aVal - bVal;
			} else if (aVal instanceof Date && bVal instanceof Date) {
				comparison = aVal.getTime() - bVal.getTime();
			} else {
				comparison = String(aVal).localeCompare(String(bVal));
			}

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	});

	function handleSort(column: Column<T>) {
		if (!column.sortable) return;

		if (sortColumn === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}
	}

	function getCellValue(row: T, column: Column<T>): string {
		const value = row[column.key] as unknown;
		if (column.render) {
			return column.render(value, row);
		}
		return String(value || '');
	}
</script>

<!-- 데스크톱 테이블 뷰 -->
<div class="hidden md:block">
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow {className}">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						{#each columns as column (column.key)}
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase lg:px-6"
								class:cursor-pointer={column.sortable}
								class:hover:bg-gray-100={column.sortable}
								onclick={() => handleSort(column)}
							>
								<div class="flex items-center space-x-1">
									<span>{column.label}</span>
									{#if column.sortable}
										<div class="flex flex-col">
											<i
												class="fas fa-caret-up text-xs"
												class:text-blue-600={sortColumn === column.key && sortDirection === 'asc'}
												class:text-gray-400={sortColumn !== column.key || sortDirection !== 'asc'}
											></i>
											<i
												class="fas fa-caret-down -mt-1 text-xs"
												class:text-blue-600={sortColumn === column.key && sortDirection === 'desc'}
												class:text-gray-400={sortColumn !== column.key || sortDirection !== 'desc'}
											></i>
										</div>
									{/if}
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if loading}
						{#each Array(5) as _, index (index)}
							<tr>
								{#each columns as _, colIndex (colIndex)}
									<td class="px-4 py-4 whitespace-nowrap lg:px-6">
										<div class="h-4 animate-pulse rounded bg-gray-200"></div>
									</td>
								{/each}
							</tr>
						{/each}
					{:else if sortedData.length === 0}
						<tr>
							<td colspan={columns.length} class="px-6 py-12 text-center text-sm text-gray-500">
								<div class="flex flex-col items-center space-y-3">
									<i class="fas fa-inbox text-3xl text-gray-300"></i>
									<p>{emptyMessage}</p>
								</div>
							</td>
						</tr>
					{:else}
						{#each sortedData as row, rowIndex (rowIndex)}
							<tr class="hover:bg-gray-50">
								{#each columns as column, colIndex (colIndex)}
									<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 lg:px-6">
										{#if cell}
											{@render cell({ column, row })}
										{:else}
											{getCellValue(row, column)}
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- 모바일 카드 뷰 -->
<div class="block md:hidden">
	<div class="space-y-3 {className}">
		{#if loading}
			{#each Array(3) as _, index (index)}
				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow">
					<div class="space-y-3">
						{#each Array(3) as _, colIndex (colIndex)}
							<div class="flex justify-between">
								<div class="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
								<div class="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		{:else if sortedData.length === 0}
			<div class="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
				<div class="flex flex-col items-center space-y-3">
					<i class="fas fa-inbox text-3xl text-gray-300"></i>
					<p class="text-sm text-gray-500">{emptyMessage}</p>
				</div>
			</div>
		{:else}
			{#each sortedData as row, rowIndex (rowIndex)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:shadow-md"
				>
					{#if mobileCard}
						{@render mobileCard({ row, columns })}
					{:else}
						<div class="space-y-3">
							{#each columns as column, colIndex (colIndex)}
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-500">{column.label}:</span>
									<span class="text-sm text-gray-900">
										{#if cell}
											{@render cell({ column, row })}
										{:else}
											{getCellValue(row, column)}
										{/if}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
