import type { Client } from '$lib/types/oauth.types';

export interface ScopeInfo {
	icon: string;
	description: string;
	category: string;
	risk?: 'low' | 'medium' | 'high';
}

export interface AuthorizationState {
	loading: boolean;
	submitting: boolean;
	error: AuthorizationError | null;
	client: Client | null;
	scopes: string[];
	loadingProgress: number;
}

export interface AuthorizationError {
	type: ErrorType;
	message: string;
	retryable: boolean;
	details?: string;
}

export enum ErrorType {
	NETWORK_ERROR = 'network',
	TIMEOUT_ERROR = 'timeout',
	INVALID_PARAMS = 'params',
	CLIENT_NOT_FOUND = 'client',
	SCOPE_INVALID = 'scope',
	SERVER_ERROR = 'server',
	UNKNOWN = 'unknown'
}

import { type Writable } from 'svelte/store';

export interface AuthorizationHookReturn {
	state: Writable<AuthorizationState>;
	loadAuthorizationData: () => Promise<void>;
	handleConsent: (approved: boolean) => Promise<void>;
	retryAuthorization: () => Promise<void>;
}
