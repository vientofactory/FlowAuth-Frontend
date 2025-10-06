<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'info' | 'warning' | 'error';
		title: string;
		description?: string;
		links?: Array<{
			text: string;
			url: string;
			icon?: string;
		}>;
		icon?: string;
	}

	let {
		variant = 'info',
		title,
		description,
		links = [],
		icon
	}: Props = $props();

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
	const defaultIcons = {
		primary: 'fas fa-info-circle',
		secondary: 'fas fa-info-circle',
		info: 'fas fa-info-circle',
		warning: 'fas fa-exclamation-triangle',
		error: 'fas fa-exclamation-circle'
	};

	const styles = variantStyles[variant];
	const defaultIcon = defaultIcons[variant];
	const displayIcon = icon || defaultIcon;
</script>

<div class="{styles.container} border rounded-lg p-4 mb-6">
	<div class="flex items-start">
		<div class="flex-shrink-0">
			<i class="{displayIcon} {styles.icon} text-lg"></i>
		</div>
		<div class="ml-3 flex-1">
			<h3 class="text-sm font-medium {styles.title} mb-2">{title}</h3>
			{#if description}
				<p class="text-sm {styles.description} mb-3">
					{description}
				</p>
			{/if}
			{#if links.length > 0}
				<div class="flex flex-col sm:flex-row gap-3">
					{#each links as link}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center text-sm {styles.link} hover:underline"
						>
							{#if link.icon}
								<i class="{link.icon} mr-1"></i>
							{/if}
							{link.text}
							<i class="fas fa-external-link-alt ml-1 text-xs"></i>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>