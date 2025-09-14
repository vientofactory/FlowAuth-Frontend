// place files you want to import through the `$lib` alias in this folder.

// Components
export { default as Button } from './components/Button.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Card } from './components/Card.svelte';
export { default as Toast } from './components/Toast.svelte';
export { default as ToastContainer } from './components/ToastContainer.svelte';
export { default as Table } from './components/Table.svelte';
export { default as Modal } from './components/Modal.svelte';
export { default as Tabs } from './components/Tabs.svelte';
export { default as Badge } from './components/Badge.svelte';
export { default as Dropdown } from './components/Dropdown.svelte';
export { default as Loading } from './components/Loading.svelte';
export { default as DashboardLayout } from './components/DashboardLayout.svelte';

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
	createdAt?: string;
	updatedAt?: string;
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
