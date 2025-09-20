import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';

export default {
	title: 'Components/UI/ErrorMessage',
	component: ErrorMessage,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
};

export const Default = {
	args: {
		error: 'This is a default error message'
	}
};

export const ValidationError = {
	args: {
		error: 'Please enter a valid email address'
	}
};

export const LongError = {
	args: {
		error:
			'This is a very long error message that might span multiple lines and should be properly handled by the component styling to ensure good readability and user experience.'
	}
};

export const NetworkError = {
	args: {
		error: 'Network connection failed. Please check your internet connection and try again.'
	}
};

export const NoError = {
	args: {
		error: ''
	}
};
