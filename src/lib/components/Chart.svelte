<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Chart as ChartJS,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement
	} from 'chart.js';

	// Chart.js 등록
	ChartJS.register(
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		BarElement,
		Title,
		Tooltip,
		Legend,
		ArcElement
	);

	import type { ChartData, ChartOptions } from 'chart.js';

	interface Props {
		type: 'line' | 'bar' | 'doughnut';
		data: ChartData;
		options?: ChartOptions;
		height?: number;
		width?: number;
	}

	let { type, data, options = {}, height = 300, width }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: ChartJS | null = null;
	let updateTimeout: number | null = null;

	// 기본 옵션 설정
	const defaultOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				position: 'top' as const
			}
		}
	};

	const chartOptions = $derived({ ...defaultOptions, ...options });

	// 디바운스된 차트 업데이트 함수
	function debouncedUpdate() {
		if (updateTimeout) {
			clearTimeout(updateTimeout as number);
		}

		updateTimeout = setTimeout(() => {
			if (chart) {
				chart.data = data;
				chart.options = { ...defaultOptions, ...options };
				chart.update();
			}
			updateTimeout = null;
		}, 100) as unknown as number; // 100ms 디바운스
	}

	onMount(() => {
		if (canvas) {
			const ctx = canvas.getContext('2d');
			if (ctx) {
				chart = new ChartJS(ctx, {
					type,
					data,
					options: chartOptions
				});
			}
		}

		return () => {
			if (chart) {
				chart.destroy();
			}
			if (updateTimeout) {
				clearTimeout(updateTimeout);
			}
		};
	});

	// 데이터나 옵션이 변경될 때 디바운스된 차트 업데이트
	$effect(() => {
		// data와 options의 변경을 감지하여 디바운스된 업데이트 실행
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		data;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		options;
		debouncedUpdate();
	});
</script>

<div class="chart-container" style="height: {height}px; width: {width ? `${width}px` : '100%'}">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
	}
</style>
