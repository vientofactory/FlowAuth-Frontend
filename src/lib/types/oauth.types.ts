export interface Client {
	id: number;
	clientId: string;
	name: string;
	description?: string;
	redirectUris: string[];
	isConfidential: boolean;
	isActive: boolean;
	scopes?: string[];
	logoUri?: string;
	termsOfServiceUri?: string;
	policyUri?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Token {
	id: number;
	accessToken: string;
	refreshToken?: string;
	tokenType: string;
	expiresAt: string;
	refreshExpiresAt?: string;
	scopes?: string | string[];
	userId: number;
	clientId?: number;
	client?: {
		name: string;
		clientId: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface AuthorizeRequest {
	client_id: string;
	redirect_uri: string;
	response_type: string;
	scope?: string;
	state?: string;
	code_challenge?: string;
	code_challenge_method?: string;
}

export interface ConsentRequest extends AuthorizeRequest {
	approved: boolean;
}

export interface AuthorizeResponse {
	code?: string;
	access_token?: string;
	id_token?: string;
	token_type?: string;
	expires_in?: number;
	state?: string;
	redirect_uri: string;
}

export interface ImplicitTokenResponse {
	access_token?: string;
	id_token?: string;
	token_type: string;
	expires_in?: number;
	state?: string;
}

export interface IdTokenPayload {
	iss: string;
	sub: string;
	aud: string;
	exp: number;
	iat: number;
	auth_time?: number;
	nonce?: string;
	email?: string;
	email_verified?: boolean;
	preferred_username?: string;
	roles?: string[];
	[key: string]: unknown;
}

export interface TokenRequest {
	grant_type: string;
	client_id?: string;
	client_secret?: string;
	code?: string;
	redirect_uri?: string;
	code_verifier?: string;
	refresh_token?: string;
	scope?: string;
}

export interface TokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
}

export interface Scope {
	id: number;
	name: string;
	description: string;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
}
