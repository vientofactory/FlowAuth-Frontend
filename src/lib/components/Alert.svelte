<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import {
		faCheckCircle,
		faExclamationTriangle,
		faInfoCircle,
		faExternalLinkAlt
	} from '@fortawesome/free-solid-svg-icons';
	import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

	interface Props {
		variant: 'success' | 'error' | 'warning' | 'info';
		title?: string;
		message?: string;
		links?: Array<{
			text: string;
			url: string;
			icon?: IconDefinition;
		}>;
		icon?: IconDefinition;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { variant, title, message, links = [], icon, class: className, children }: Props = $props();

	const variants = {
		success: {
			border: 'border-green-200',
			bg: 'bg-green-50',
			text: 'text-green-800',
			iconColor: 'text-green-600',
			defaultIcon: faCheckCircle
		},
		error: {
			border: 'border-red-200',
			bg: 'bg-red-50',
			text: 'text-red-800',
			iconColor: 'text-red-600',
			defaultIcon: faExclamationTriangle
		},
		warning: {
			border: 'border-yellow-200',
			bg: 'bg-yellow-50',
			text: 'text-yellow-800',
			iconColor: 'text-yellow-600',
			defaultIcon: faExclamationTriangle
		},
		info: {
			border: 'border-blue-200',
			bg: 'bg-blue-50',
			text: 'text-blue-800',
			iconColor: 'text-blue-600',
			defaultIcon: faInfoCircle
		}
	};

	const v = variants[variant];
	const displayIcon = icon || v.defaultIcon;
</script>

<div class="mb-4 rounded-lg border {v.border} {v.bg} p-4 {className || ''}">
	<div class="flex items-center">
		<FontAwesomeIcon icon={displayIcon} class="mr-2 {v.iconColor}" />
		{#if title}
			<span class="font-medium {v.text}">{title}</span>
		{/if}
	</div>
	{#if title}
		<div class="mt-1 {v.text}">
			{#if message}
				{message}
			{:else if children}
				{@render children()}
			{/if}
			{#if links.length > 0}
				<div class="mt-3 flex flex-col gap-3 sm:flex-row">
					{#each links as link, i (i)}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center text-sm {v.text.replace(
								'text-',
								'hover:'
							)} hover:underline"
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
	{:else}
		<div class={v.text}>
			{#if message}
				{message}
			{:else if children}
				{@render children()}
			{/if}
			{#if links.length > 0}
				<div class="mt-3 flex flex-col gap-3 sm:flex-row">
					{#each links as link, i (i)}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center text-sm {v.text.replace(
								'text-',
								'hover:'
							)} hover:underline"
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
	{/if}
</div>
