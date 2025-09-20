import LoadingButton from '$lib/components/ui/LoadingButton.svelte';

export default {
	title: 'Components/UI/LoadingButton',
	component: LoadingButton,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
};

export const Default = {
	args: {
		loading: false,
		disabled: false,
		type: 'submit',
		variant: 'primary'
	}
};

export const Loading = {
	args: {
		loading: true,
		disabled: false,
		type: 'submit',
		variant: 'primary'
	}
};

export const Disabled = {
	args: {
		loading: false,
		disabled: true,
		type: 'button',
		variant: 'primary'
	}
};

export const Secondary = {
	args: {
		loading: false,
		disabled: false,
		type: 'button',
		variant: 'secondary'
	}
};

export const WithLoadingText = {
	args: {
		loading: true,
		disabled: false,
		type: 'submit',
		variant: 'primary',
		loadingText: 'Saving...'
	}
};
