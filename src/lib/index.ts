// place files you want to import through the `$lib` alias in this folder.

// Components
export { default as Button } from './components/Button.svelte';
export { default as Input } from './components/Input.svelte';
export { default as Card } from './components/Card.svelte';

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

export interface RegisterData {
	username: string;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}
