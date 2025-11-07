<script lang="ts">
	interface DashboardSkeletonProps {
		type?: 'stats' | 'chart' | 'table' | 'card' | 'activity' | 'profile' | 'insights';
		count?: number;
		class?: string;
	}

	let { type = 'card', count = 1, class: className = '' }: DashboardSkeletonProps = $props();
</script>

{#if type === 'stats'}
	<!-- 실제 StatsCards와 일치하는 그리드 구조 -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 {className}">
		{#each Array(count || 5) as _, i (i)}
			<div
				class="overflow-hidden rounded-xl bg-linear-to-br from-gray-200 to-gray-300 p-6 shadow-lg"
			>
				<div class="flex items-center justify-between">
					<div class="flex-1">
						<div class="mb-1 h-4 w-16 animate-pulse rounded bg-white/40"></div>
						<div class="h-8 w-20 animate-pulse rounded bg-white/40"></div>
					</div>
					<div class="h-12 w-12 animate-pulse rounded bg-white/40"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if type === 'insights'}
	<!-- 인사이트 카드 스켈레톤 -->
	<div
		class="overflow-hidden rounded-xl border-l-4 border-l-gray-300 bg-linear-to-r from-gray-50 to-gray-100 p-6 shadow-sm ring-1 ring-gray-200 {className}"
	>
		<div class="flex items-start space-x-4">
			<div class="shrink-0">
				<div class="h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
			</div>
			<div class="flex-1">
				<div class="mb-3 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
				<div class="grid gap-4 md:grid-cols-3">
					{#each Array(3) as _, i (i)}
						<div class="flex items-start space-x-3 rounded-lg border border-gray-200 bg-white p-3">
							<div class="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200"></div>
							<div class="min-w-0 flex-1">
								<div class="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
								<div class="h-3 w-full animate-pulse rounded bg-gray-100"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else if type === 'chart'}
	<!-- 실제 차트 카드와 일치하는 구조 -->
	<div
		class="overflow-hidden rounded-xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-lg {className}"
	>
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center space-x-2">
					<div class="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
					<div class="h-5 w-48 animate-pulse rounded bg-gray-200"></div>
				</div>
				<div class="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
			</div>
			<div class="h-80 animate-pulse rounded-lg bg-gray-50">
				<div class="flex h-full items-end justify-center space-x-1 p-4">
					{#each Array(12) as _, i (i)}
						<div
							class="w-6 animate-pulse rounded-t bg-gray-200"
							style="height: {Math.random() * 70 + 15}%; animation-delay: {i * 0.1}s"
						></div>
					{/each}
				</div>
			</div>
		</div>
	</div>
{:else if type === 'table'}
	<!-- 실제 클라이언트 리스트/토큰 리스트와 일치하는 구조 -->
	<div
		class="relative overflow-hidden rounded-xl bg-linear-to-r from-slate-50 to-gray-50 p-6 shadow-sm ring-1 ring-gray-100 {className}"
	>
		<div class="relative">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200"></div>
					<div class="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
				</div>
			</div>

			<div class="space-y-4">
				{#each Array(count || 3) as _, i (i)}
					<div
						class="group relative overflow-hidden rounded-lg border border-gray-100 bg-white/60 p-4 backdrop-blur-sm"
					>
						<div
							class="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
						>
							<div class="flex-1">
								<!-- 제목과 뱃지 -->
								<div
									class="mb-3 flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3"
								>
									<div class="h-6 w-48 animate-pulse rounded bg-gray-200"></div>
									<div class="h-6 w-12 animate-pulse rounded-full bg-gray-200"></div>
								</div>

								<!-- 설명 -->
								<div class="mb-3 h-4 w-3/4 animate-pulse rounded bg-gray-100"></div>

								<!-- 정보 그리드 -->
								<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{#each Array(3) as _, j (j)}
										<div class="flex items-center space-x-3 rounded-lg bg-gray-50/60 p-3">
											<div class="h-8 w-8 animate-pulse rounded-lg bg-gray-200"></div>
											<div class="min-w-0 flex-1">
												<div class="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200"></div>
												<div class="h-4 w-24 animate-pulse rounded bg-gray-100"></div>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- 액션 버튼들 -->
							<div class="flex flex-wrap gap-2 sm:flex-col">
								{#each Array(3) as _, j (j)}
									<div class="h-8 w-20 animate-pulse rounded bg-gray-200"></div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else if type === 'activity'}
	<!-- 실제 RecentActivities와 일치하는 구조 -->
	<div class="space-y-4 {className}">
		{#each Array(count || 5) as _, i (i)}
			<div
				class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
			>
				<div class="flex items-start space-x-4">
					<div class="shrink-0">
						<div
							class="h-10 w-10 animate-pulse rounded-full bg-linear-to-br from-gray-200 to-gray-300"
						></div>
					</div>
					<div class="min-w-0 flex-1">
						<div class="mb-2 flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-1 h-4 w-40 animate-pulse rounded bg-gray-200"></div>
								<div class="h-3 w-24 animate-pulse rounded bg-gray-100"></div>
							</div>
							<div class="h-3 w-16 animate-pulse rounded bg-gray-100"></div>
						</div>
						<div class="mb-2 h-4 w-full animate-pulse rounded bg-gray-100"></div>
						<div class="h-3 w-2/3 animate-pulse rounded bg-gray-100"></div>

						<!-- 메타데이터 영역 -->
						<div class="mt-3 flex flex-wrap gap-2">
							{#each Array(2) as _, j (j)}
								<div class="h-5 w-16 animate-pulse rounded-full bg-gray-100"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if type === 'profile'}
	<!-- 실제 프로필 페이지와 일치하는 그리드 구조 -->
	<div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 {className}">
		<!-- 프로필 정보 (왼쪽 2컬럼) -->
		<div class="lg:col-span-2">
			<div class="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div
					class="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between"
				>
					<div class="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
					<div class="h-10 w-16 animate-pulse rounded-lg bg-gray-200"></div>
				</div>

				<!-- 아바타 섹션 -->
				<div class="mb-6">
					<div class="mb-3 h-4 w-16 animate-pulse rounded bg-gray-200"></div>
					<div class="flex items-center space-x-4">
						<div class="h-20 w-20 animate-pulse rounded-full bg-gray-200"></div>
						<div class="space-y-2">
							<div class="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
							<div class="h-6 w-20 animate-pulse rounded bg-gray-100"></div>
						</div>
					</div>
				</div>

				<!-- 폼 필드들 -->
				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#each Array(4) as _, i (i)}
							<div>
								<div class="mb-2 h-4 w-16 animate-pulse rounded bg-gray-200"></div>
								<div class="h-10 w-full animate-pulse rounded-lg bg-gray-100"></div>
							</div>
						{/each}
					</div>
				</div>

				<!-- 버튼들 -->
				<div class="mt-6 flex space-x-3">
					<div class="h-10 w-20 animate-pulse rounded-lg bg-gray-200"></div>
					<div class="h-10 w-16 animate-pulse rounded-lg bg-gray-100"></div>
				</div>
			</div>
		</div>

		<!-- 사이드바 (오른쪽 1컬럼) -->
		<div class="space-y-6">
			{#each Array(2) as _, i (i)}
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="mb-4 h-6 w-20 animate-pulse rounded bg-gray-200"></div>
					<div class="space-y-3">
						{#each Array(3) as _, j (j)}
							<div class="h-12 w-full animate-pulse rounded-lg bg-gray-100"></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else}
	<!-- 기본 카드 스켈레톤 -->
	<div class="space-y-4 {className}">
		{#each Array(count) as _, i (i)}
			<div class="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
				<div class="flex items-start space-x-4">
					<div class="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-200"></div>
					<div class="min-w-0 flex-1">
						<div class="mb-3 h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
						<div class="space-y-2">
							<div class="h-4 w-full animate-pulse rounded bg-gray-100"></div>
							<div class="h-4 w-5/6 animate-pulse rounded bg-gray-100"></div>
							<div class="h-4 w-4/6 animate-pulse rounded bg-gray-100"></div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
