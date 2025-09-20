<script lang="ts">
	interface Props {
		message: string;
		type?: 'error' | 'warning' | 'info';
		icon?: string;
		class?: string;
		dismissible?: boolean;
		onDismiss?: () => void;
	}

	let {
		message,
		type = 'error',
		icon = '',
		class: className = '',
		dismissible = false,
		onDismiss
	}: Props = $props();

	const typeConfig = {
		error: {
			bgColor: 'bg-red-50',
			textColor: 'text-red-600',
			borderColor: 'border-red-200',
			defaultIcon: 'fas fa-exclamation-circle'
		},
		warning: {
			bgColor: 'bg-yellow-50',
			textColor: 'text-yellow-600',
			borderColor: 'border-yellow-200',
			defaultIcon: 'fas fa-exclamation-triangle'
		},
		info: {
			bgColor: 'bg-blue-50',
			textColor: 'text-blue-600',
			borderColor: 'border-blue-200',
			defaultIcon: 'fas fa-info-circle'
		}
	};

	const config = typeConfig[type];
	const displayIcon = icon || config.defaultIcon;
</script>

<div
	class="rounded-md border p-3 {config.bgColor} {config.borderColor} {className}"
	role="alert"
	aria-live="assertive"
>
	<div class="flex items-start">
		<div class="flex-shrink-0">
			<i class="{displayIcon} {config.textColor}"></i>
		</div>
		<div class="ml-3 flex-1">
			<p class="text-sm {config.textColor}">{message}</p>
		</div>
		{#if dismissible && onDismiss}
			<div class="ml-auto pl-3">
				<button
					type="button"
					class="inline-flex rounded-md p-1.5 {config.textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2"
					onclick={onDismiss}
					aria-label="닫기"
				>
					<i class="fas fa-times text-sm"></i>
				</button>
			</div>
		{/if}
	</div>
</div>