<script lang="ts">
	import { Button } from '$lib';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faBolt } from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface QuickAction {
		label: string;
		icon: IconDefinition | string;
		color: string;
		action: () => void;
	}

	interface Props {
		quickActions: QuickAction[];
	}

	let { quickActions }: Props = $props();

	// 색상 설정 상수
	const COLOR_CLASSES = {
		blue: {
			hover: 'hover:border-stone-400 hover:bg-stone-50',
			background: 'bg-stone-100 group-hover:bg-stone-200',
			text: 'text-stone-600'
		},
		green: {
			hover: 'hover:border-neutral-400 hover:bg-neutral-50',
			background: 'bg-neutral-100 group-hover:bg-neutral-200',
			text: 'text-neutral-600'
		},
		purple: {
			hover: 'hover:border-gray-400 hover:bg-gray-50',
			background: 'bg-gray-100 group-hover:bg-gray-200',
			text: 'text-gray-600'
		},
		orange: {
			hover: 'hover:border-slate-400 hover:bg-slate-50',
			background: 'bg-slate-100 group-hover:bg-slate-200',
			text: 'text-slate-600'
		}
	} as const;

	// 그리드 컬럼 수 계산 함수
	function getGridColsClass(count: number): string {
		switch (count) {
			case 1:
				return 'grid-cols-1';
			case 2:
				return 'grid-cols-1 sm:grid-cols-2';
			case 3:
				return 'grid-cols-2 sm:grid-cols-3';
			default:
				return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
		}
	}
</script>

<div
	class="relative overflow-hidden rounded-xl bg-linear-to-r from-stone-50 to-gray-50 p-6 shadow-sm ring-1 ring-stone-100"
>
	<div class="relative">
		<div class="mb-6 text-center sm:text-left">
			<h3
				class="mb-2 flex items-center justify-center text-lg font-semibold text-gray-900 sm:justify-start"
			>
				<div class="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100">
					<FontAwesomeIcon icon={faBolt} class="text-stone-600" />
				</div>
				빠른 작업
			</h3>
			<p class="text-sm text-gray-600">자주 사용하는 기능을 빠르게 실행하세요</p>
		</div>
		<div class="grid gap-4 {getGridColsClass(quickActions.length)}">
			{#each quickActions as action, actionIndex (action.label || `action-${actionIndex}`)}
				{@const colorClass = COLOR_CLASSES[action.color as keyof typeof COLOR_CLASSES]}
				<div
					class="group relative overflow-hidden rounded-xl border border-gray-100 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/80 hover:shadow-lg"
				>
					<Button
						variant="ghost"
						class="flex h-full w-full flex-col items-center justify-center space-y-3 p-0 hover:bg-transparent"
						onclick={action.action}
					>
						<div class="relative">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 {colorClass?.background ||
									'bg-gray-100'} group-hover:scale-110 group-hover:shadow-lg"
							>
								{#if typeof action.icon === 'string'}
									<i class="text-xl {colorClass?.text || 'text-gray-600'} {action.icon}"></i>
								{:else}
									<FontAwesomeIcon
										icon={action.icon}
										class="text-xl {colorClass?.text || 'text-gray-600'}"
									/>
								{/if}
							</div>
							<div
								class="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-linear-to-br from-stone-400 to-gray-500 opacity-0 transition-opacity group-hover:opacity-100"
							></div>
						</div>
						<span
							class="text-center text-sm leading-tight font-medium text-gray-700 transition-colors group-hover:text-gray-900"
						>
							{action.label}
						</span>
					</Button>
				</div>
			{/each}
		</div>
	</div>
</div>
