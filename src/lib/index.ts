// place files you want to import through the `$lib` alias in this folder.

// Components
export { default as Button } from './components/Button.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Card } from './components/Card.svelte';
export { default as Toast } from './components/Toast.svelte';
export { default as ToastContainer } from './components/ToastContainer.svelte';

// Composables
export { useToast } from './composables/useToast';

// API
export { apiClient } from './utils/api';
export type { CreateClientData } from './utils/api';

// Types
export interface User {
	id: number;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface CreateUserDto {
	email: string;
	password: string;
	username: string;
	firstName: string;
	lastName: string;
}

// Stores
export { authStore, authState } from './stores/auth';
export { toast, toastStore } from './stores/toast';
export type { ToastMessage } from './stores/toast';
