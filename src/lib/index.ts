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
export { default as AuthLayout } from './components/AuthLayout.svelte';
export { default as PageHeader } from './components/PageHeader.svelte';
export { default as Navigation } from './components/Navigation.svelte';
export { default as LogoUpload } from './components/LogoUpload.svelte';

// Composables
export { useToast } from './composables/useToast';

// API
export { apiClient } from './utils/api';
export type { CreateClientData } from './utils/api';

// Permissions
export {
	PermissionUtils,
	PERMISSIONS,
	ROLES,
	ROLE_NAMES,
	PERMISSION_NAMES
} from './utils/permissions';

// Types
export interface User {
	id: number;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	isEmailVerified: number;
	permissions: string;
	createdAt: string;
	updatedAt: string;
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
export { authState, authStore } from './stores/auth';
export { toast } from './stores/toast';
export { twoFactorStore } from './stores/2fa';

// Constants
export {
	APP_CONSTANTS,
	ROUTES,
	API_ENDPOINTS,
	UI_CONSTANTS,
	MESSAGES,
	STYLE_CONSTANTS
} from './constants/app.constants';
export type { ToastMessage } from './stores/toast';
