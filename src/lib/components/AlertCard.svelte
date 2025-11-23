<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
	import {
		faInfoCircle,
		faExclamationTriangle,
		faExclamationCircle,
		faExternalLinkAlt
	} from '@fortawesome/free-solid-svg-icons';

	interface Props {
		variant?: 'primary' | 'secondary' | 'info' | 'warning' | 'error';
		title: string;
		description?: string;
		links?: Array<{
			text: string;
			url: string;
			icon?: IconDefinition;
		}>;
		icon?: IconDefinition;
	}

	let { variant = 'info', title, description, links = [], icon }: Props = $props();

	// Variant별 스타일 설정
	const variantStyles = {
		primary: {
			container: 'bg-blue-50 border-blue-200',
			icon: 'text-blue-600',
			title: 'text-blue-800',
			description: 'text-blue-700',
			link: 'text-blue-600 hover:text-blue-800'
		},
		secondary: {
			container: 'bg-gray-50 border-gray-200',
			icon: 'text-gray-600',
			title: 'text-gray-800',
			description: 'text-gray-700',
			link: 'text-gray-600 hover:text-gray-800'
		},
		info: {
			container: 'bg-blue-50 border-blue-200',
			icon: 'text-blue-600',
			title: 'text-blue-800',
			description: 'text-blue-700',
			link: 'text-blue-600 hover:text-blue-800'
		},
		warning: {
			container: 'bg-yellow-50 border-yellow-200',
			icon: 'text-yellow-600',
			title: 'text-yellow-800',
			description: 'text-yellow-700',
			link: 'text-yellow-600 hover:text-yellow-800'
		},
		error: {
			container: 'bg-red-50 border-red-200',
			icon: 'text-red-600',
			title: 'text-red-800',
			description: 'text-red-700',
			link: 'text-red-600 hover:text-red-800'
		}
	};

	// Variant별 기본 아이콘
	const defaultIcons: Record<string, IconDefinition> = {
		primary: faInfoCircle,
		secondary: faInfoCircle,
		info: faInfoCircle,
		warning: faExclamationTriangle,
		error: faExclamationCircle
	};

	const styles = variantStyles[variant];
	const defaultIcon = defaultIcons[variant];
	const displayIcon = icon || defaultIcon;
</script>

<div class="{styles.container} mb-6 rounded-lg border p-4">
	<div class="flex items-start">
		<div class="shrink-0">
			<FontAwesomeIcon icon={displayIcon} class="{styles.icon} text-lg" />
		</div>
		<div class="ml-3 flex-1">
			<h3 class="text-sm font-medium {styles.title} mb-2">{title}</h3>
			{#if description}
				<p class="text-sm {styles.description} mb-3">
					{description}
				</p>
			{/if}
			{#if links.length > 0}
				<div class="flex flex-col gap-3 sm:flex-row">
					{#each links as link, i (i)}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center text-sm {styles.link} hover:underline"
						>
							{#if link.icon}
								<FontAwesomeIcon icon={link.icon} class="mr-1" />
							{/if}
							{link.text}
							<FontAwesomeIcon icon={faExternalLinkAlt} class="ml-1 text-xs" />
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
