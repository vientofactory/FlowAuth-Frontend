import type { Client } from '$lib/types/oauth.types';
import type { User } from '$lib/types/user.types';
import type { ErrorCode } from '@flowauth/shared';

export const TOKEN_TYPES = {
	LOGIN: 'login',
	OAUTH2: 'oauth2'
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

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
	currentUser: User | null;
}

export interface AuthorizationError {
	type: ErrorType;
	message: string;
	retryable: boolean;
	details?: string;
	errorCode?: ErrorCode;
}

export enum ErrorType {
	NETWORK_ERROR = 'network',
	TIMEOUT_ERROR = 'timeout',
	INVALID_PARAMS = 'params',
	CLIENT_NOT_FOUND = 'client',
	SCOPE_INVALID = 'scope',
	SERVER_ERROR = 'server',
	AUTHENTICATION_ERROR = 'auth',
	AUTHORIZATION_ERROR = 'authorization',
	NOT_FOUND = 'not_found',
	CONFLICT = 'conflict',
	RATE_LIMITED = 'rate_limited',
	UNKNOWN = 'unknown'
}

import { type Writable } from 'svelte/store';

export interface AuthorizationHookReturn {
	state: Writable<AuthorizationState>;
	loadAuthorizationData: () => Promise<void>;
	handleConsent: (approved: boolean) => Promise<void>;
	retryAuthorization: () => Promise<void>;
}
