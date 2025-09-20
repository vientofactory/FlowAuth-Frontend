import FormField from '$lib/components/form/FormField.svelte';

export default {
	title: 'Components/Form/FormField',
	component: FormField,
	parameters: {
		layout: 'padded'
	},
	tags: ['autodocs']
};

export const Default = {
	args: {
		name: 'example',
		label: 'Example Field',
		value: '',
		placeholder: 'Enter text here...'
	}
};

export const WithIcon = {
	args: {
		name: 'email',
		label: 'Email Address',
		value: '',
		placeholder: 'your@email.com',
		type: 'email',
		icon: 'fas fa-envelope'
	}
};

export const WithError = {
	args: {
		name: 'username',
		label: 'Username',
		value: 'invalid@user',
		error: 'Username can only contain letters, numbers, and underscores',
		icon: 'fas fa-user'
	}
};

export const WithHint = {
	args: {
		name: 'password',
		label: 'Password',
		value: '',
		type: 'password',
		placeholder: 'Enter password',
		hint: 'Must be at least 8 characters with uppercase, lowercase, and numbers',
		icon: 'fas fa-lock'
	}
};

export const Required = {
	args: {
		name: 'required-field',
		label: 'Required Field',
		value: '',
		placeholder: 'This field is required',
		required: true,
		icon: 'fas fa-asterisk'
	}
};

export const Disabled = {
	args: {
		name: 'disabled-field',
		label: 'Disabled Field',
		value: 'Cannot edit this',
		disabled: true,
		icon: 'fas fa-lock'
	}
};
