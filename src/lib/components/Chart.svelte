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
		};
	});

	// 데이터나 옵션이 변경될 때 차트 업데이트
	$effect(() => {
		if (chart) {
			chart.data = data;
			chart.options = { ...defaultOptions, ...options };
			chart.update();
		}
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
