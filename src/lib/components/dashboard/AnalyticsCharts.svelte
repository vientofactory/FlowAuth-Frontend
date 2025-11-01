<script lang="ts">
	import { Card, Badge } from '$lib';
	import Chart from '$lib/components/Chart.svelte';

	interface Props {
		dashboardStats: {
			tokenIssuanceByHour: Array<{ hour: string; count: number }>;
			tokenIssuanceByDay: Array<{ date: string; count: number }>;
			clientUsageStats: Array<{
				clientName: string;
				tokenCount: number;
				percentage: number;
			}>;
		};
		tokenAnalytics: {
			usagePatterns: {
				peakHours: Array<{ hour: number; count: number; percentage: number }>;
			};
			clientPerformance: Array<{
				clientId: number;
				clientName: string;
				totalTokens: number;
				activeTokens: number;
				avgResponseTime: number;
				errorRate: number;
				lastActivity: string;
			}>;
		};
		securityMetrics: {
			threatDetection: {
				timeBasedPatterns: Array<{ hour: number; threatCount: number }>;
			};
		};
	}

	let { dashboardStats, tokenAnalytics, securityMetrics }: Props = $props();
</script>

<!-- 메인 차트 그리드 -->
<div class="grid gap-6 lg:grid-cols-2">
	<!-- 시간별 토큰 발급 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-clock mr-2 text-stone-600"></i>
				24시간 토큰 발급 추이
			</h3>
			<Badge variant="info" size="sm">실시간</Badge>
		</div>
		{#if dashboardStats.tokenIssuanceByHour.some((h) => h.count > 0)}
			<div class="h-80">
				<Chart
					type="line"
					data={{
						labels: dashboardStats.tokenIssuanceByHour.map((h) => h.hour),
						datasets: [
							{
								label: '토큰 발급 수',
								data: dashboardStats.tokenIssuanceByHour.map((h) => h.count),
								borderColor: 'rgb(59, 130, 246)',
								backgroundColor: 'rgba(59, 130, 246, 0.1)',
								tension: 0.4,
								fill: true,
								pointBackgroundColor: 'rgb(59, 130, 246)',
								pointBorderColor: '#ffffff',
								pointBorderWidth: 2,
								pointRadius: 4,
								pointHoverRadius: 6
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									stepSize: 1,
									font: {
										size: 12
									}
								},
								grid: {
									color: 'rgba(0, 0, 0, 0.1)'
								}
							},
							x: {
								ticks: {
									font: {
										size: 11
									}
								},
								grid: {
									display: false
								}
							}
						},
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								titleColor: '#ffffff',
								bodyColor: '#ffffff',
								cornerRadius: 8,
								displayColors: false
							}
						},
						interaction: {
							intersect: false,
							mode: 'index'
						},
						animation: {
							duration: 1000,
							easing: 'easeInOutQuart'
						}
					}}
				/>
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-chart-line mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">최근 24시간 동안</p>
					<p class="text-sm">토큰 발급 기록이 없습니다</p>
				</div>
			</div>
		{/if}
	</Card>

	<!-- 피크 시간 분석 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-chart-bar mr-2 text-stone-600"></i>
				피크 시간 분석
			</h3>
			<Badge variant="default" size="sm">고급 분석</Badge>
		</div>
		{#if tokenAnalytics?.usagePatterns?.peakHours?.length > 0}
			<div class="h-80">
				<Chart
					type="bar"
					data={{
						labels: tokenAnalytics?.usagePatterns?.peakHours?.map((h) => `${h.hour}시`) ?? [],
						datasets: [
							{
								label: '활동량',
								data: tokenAnalytics?.usagePatterns?.peakHours?.map((h) => h.count) ?? [],
								backgroundColor:
									tokenAnalytics?.usagePatterns?.peakHours?.map((h) =>
										h.percentage > 15
											? 'rgba(239, 68, 68, 0.8)'
											: h.percentage > 10
												? 'rgba(251, 191, 36, 0.8)'
												: 'rgba(34, 197, 94, 0.8)'
									) ?? [],
								borderColor:
									tokenAnalytics?.usagePatterns?.peakHours?.map((h) =>
										h.percentage > 15
											? 'rgb(239, 68, 68)'
											: h.percentage > 10
												? 'rgb(251, 191, 36)'
												: 'rgb(34, 197, 94)'
									) ?? [],
								borderWidth: 2,
								borderRadius: 6,
								borderSkipped: false
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									stepSize: 1,
									font: {
										size: 12
									}
								},
								grid: {
									color: 'rgba(0, 0, 0, 0.1)'
								}
							},
							x: {
								ticks: {
									font: {
										size: 11
									}
								},
								grid: {
									display: false
								}
							}
						},
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								titleColor: '#ffffff',
								bodyColor: '#ffffff',
								cornerRadius: 8,
								displayColors: false,
								callbacks: {
									label: function (context) {
										const percentage =
											tokenAnalytics?.usagePatterns?.peakHours?.[context.dataIndex]?.percentage ??
											0;
										return `${context.parsed.y}회 (${percentage.toFixed(1)}%)`;
									}
								}
							}
						},
						animation: {
							duration: 1200,
							easing: 'easeOutBounce'
						}
					}}
				/>
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-chart-bar mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">피크 시간 분석</p>
					<p class="text-sm">데이터가 충분하지 않습니다</p>
				</div>
			</div>
		{/if}
	</Card>

	<!-- 일별 토큰 발급 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-calendar mr-2 text-neutral-600"></i>
				30일 토큰 발급 추이
			</h3>
			<Badge variant="info" size="sm">
				{dashboardStats.tokenIssuanceByDay.filter((d) => d.count > 0).length}일 활동
			</Badge>
		</div>
		{#if dashboardStats.tokenIssuanceByDay.some((d) => d.count > 0)}
			<div class="h-80">
				<Chart
					type="bar"
					data={{
						labels: dashboardStats.tokenIssuanceByDay.map((d) => {
							const date = new Date(d.date);
							return date.toLocaleDateString('ko-KR', {
								month: 'short',
								day: 'numeric'
							});
						}),
						datasets: [
							{
								label: '토큰 발급 수',
								data: dashboardStats.tokenIssuanceByDay.map((d) => d.count),
								backgroundColor: dashboardStats.tokenIssuanceByDay.map((d) =>
									d.count > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(156, 163, 175, 0.3)'
								),
								borderColor: dashboardStats.tokenIssuanceByDay.map((d) =>
									d.count > 0 ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)'
								),
								borderWidth: 1,
								borderRadius: 4,
								borderSkipped: false
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									stepSize: 1,
									font: {
										size: 12
									}
								},
								grid: {
									color: 'rgba(0, 0, 0, 0.1)'
								}
							},
							x: {
								ticks: {
									font: {
										size: 10
									},
									maxRotation: 45
								},
								grid: {
									display: false
								}
							}
						},
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								titleColor: '#ffffff',
								bodyColor: '#ffffff',
								cornerRadius: 8,
								displayColors: false,
								callbacks: {
									title: function (context) {
										const date = new Date(
											dashboardStats.tokenIssuanceByDay[context[0].dataIndex].date
										);
										return date.toLocaleDateString('ko-KR', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											weekday: 'long'
										});
									}
								}
							}
						},
						animation: {
							duration: 1200,
							easing: 'easeOutBounce'
						}
					}}
				/>
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-chart-bar mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">최근 30일 동안</p>
					<p class="text-sm">토큰 발급 기록이 없습니다</p>
				</div>
			</div>
		{/if}
	</Card>

	<!-- 보안 위협 패턴 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-shield-alt mr-2 text-stone-600"></i>
				보안 위협 패턴
			</h3>
			<Badge variant="default" size="sm">보안</Badge>
		</div>
		{#if securityMetrics?.threatDetection?.timeBasedPatterns?.length > 0}
			<div class="h-80">
				<Chart
					type="line"
					data={{
						labels:
							securityMetrics?.threatDetection?.timeBasedPatterns?.map((p) => `${p.hour}시`) ?? [],
						datasets: [
							{
								label: '위협 발생 수',
								data:
									securityMetrics?.threatDetection?.timeBasedPatterns?.map((p) => p.threatCount) ??
									[],
								borderColor: 'rgb(239, 68, 68)',
								backgroundColor: 'rgba(239, 68, 68, 0.1)',
								tension: 0.4,
								fill: true,
								pointBackgroundColor: 'rgb(239, 68, 68)',
								pointBorderColor: '#ffffff',
								pointBorderWidth: 2,
								pointRadius: 4,
								pointHoverRadius: 6
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									stepSize: 1,
									font: {
										size: 12
									}
								},
								grid: {
									color: 'rgba(0, 0, 0, 0.1)'
								}
							},
							x: {
								ticks: {
									font: {
										size: 11
									}
								},
								grid: {
									display: false
								}
							}
						},
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								titleColor: '#ffffff',
								bodyColor: '#ffffff',
								cornerRadius: 8,
								displayColors: false
							}
						},
						interaction: {
							intersect: false,
							mode: 'index'
						},
						animation: {
							duration: 1000,
							easing: 'easeInOutQuart'
						}
					}}
				/>
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-shield-alt mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">보안 위협 패턴</p>
					<p class="text-sm">위협 데이터가 없습니다</p>
				</div>
			</div>
		{/if}
	</Card>

	<!-- 클라이언트별 사용량 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-users mr-2 text-gray-600"></i>
				클라이언트별 토큰 사용량
			</h3>
			<Badge variant="secondary" size="sm">
				{dashboardStats.clientUsageStats.length}개 클라이언트
			</Badge>
		</div>
		{#if dashboardStats.clientUsageStats.length > 0}
			<div class="h-80">
				<Chart
					type="doughnut"
					data={{
						labels: dashboardStats?.clientUsageStats?.map((c) => c.clientName) ?? [],
						datasets: [
							{
								data: dashboardStats?.clientUsageStats?.map((c) => c.tokenCount) ?? [],
								backgroundColor: [
									'rgba(59, 130, 246, 0.9)',
									'rgba(34, 197, 94, 0.9)',
									'rgba(168, 85, 247, 0.9)',
									'rgba(251, 191, 36, 0.9)',
									'rgba(239, 68, 68, 0.9)',
									'rgba(6, 182, 212, 0.9)',
									'rgba(236, 72, 153, 0.9)',
									'rgba(139, 69, 19, 0.9)',
									'rgba(107, 114, 128, 0.9)',
									'rgba(5, 150, 105, 0.9)'
								],
								borderWidth: 3,
								borderColor: '#ffffff',
								hoverBorderWidth: 4,
								hoverBorderColor: '#ffffff',
								hoverOffset: 8
							}
						]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								position: 'bottom',
								labels: {
									boxWidth: 12,
									padding: 20,
									font: {
										size: 11
									},
									usePointStyle: true
								}
							},
							tooltip: {
								backgroundColor: 'rgba(0, 0, 0, 0.8)',
								titleColor: '#ffffff',
								bodyColor: '#ffffff',
								cornerRadius: 8,
								callbacks: {
									label: function (context) {
										const label = context.label || '';
										const value = context.parsed;
										const percentage =
											dashboardStats?.clientUsageStats?.[context.dataIndex]?.percentage ?? 0;
										return `${label}: ${value}회 (${percentage.toFixed(1)}%)`;
									}
								}
							}
						},
						animation: {
							duration: 1500,
							easing: 'easeInOutQuart'
						}
					}}
				/>
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-chart-pie mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">등록된 클라이언트가</p>
					<p class="text-sm">없거나 토큰 발급 기록이 없습니다</p>
				</div>
			</div>
		{/if}
	</Card>

	<!-- 클라이언트 분석 차트 -->
	<Card class="transition-shadow duration-300 hover:shadow-lg">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-900">
				<i class="fas fa-tachometer-alt mr-2 text-stone-600"></i>
				클라이언트 성능 분석
			</h3>
			<Badge variant="default" size="sm">성능</Badge>
		</div>
		{#if tokenAnalytics?.clientPerformance?.length > 0}
			<div class="h-80 space-y-4 overflow-y-auto">
				{#each tokenAnalytics?.clientPerformance?.slice(0, 5) ?? [] as client, index (index)}
					<div
						class="flex items-center space-x-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
					>
						<div
							class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
							style="background-color: {[
								'rgba(59, 130, 246, 0.9)',
								'rgba(168, 85, 247, 0.9)',
								'rgba(34, 197, 94, 0.9)',
								'rgba(251, 191, 36, 0.9)',
								'rgba(239, 68, 68, 0.9)'
							][index % 5]}; color: white;"
						>
							{index + 1}
						</div>
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center justify-between">
								<span class="truncate font-medium text-gray-900"
									>{client?.clientName ?? '알 수 없음'}</span
								>
								<div class="flex items-center space-x-2">
									<Badge variant="secondary" size="sm">{client?.activeTokens ?? 0} 활성</Badge>
									<span class="text-sm font-medium text-gray-600"
										>{((client?.errorRate ?? 0) * 100).toFixed(1)}% 오류</span
									>
								</div>
							</div>
							<div class="text-xs text-gray-500">
								응답시간: {(client?.avgResponseTime ?? 0).toFixed(0)}ms | 총 토큰: {client?.totalTokens ??
									0}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
				<div class="text-center">
					<i class="fas fa-tachometer-alt mb-3 text-4xl opacity-50"></i>
					<p class="font-medium">클라이언트 성능 분석</p>
					<p class="text-sm">데이터가 충분하지 않습니다</p>
				</div>
			</div>
		{/if}
	</Card>
</div>
