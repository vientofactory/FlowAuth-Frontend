export interface Client {
	id: number;
	clientId: string;
	clientSecret?: string;
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

export interface DiscoveryDocument {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	userinfo_endpoint: string;
	jwks_uri: string;
	introspection_endpoint?: string;
	end_session_endpoint?: string;
	registration_endpoint?: string;
	scopes_supported?: string[];
	response_types_supported?: string[];
	grant_types_supported?: string[];
	acr_values_supported?: string[];
	subject_types_supported?: string[];
	id_token_signing_alg_values_supported?: string[];
	id_token_encryption_alg_values_supported?: string[];
	id_token_encryption_enc_values_supported?: string[];
	userinfo_signing_alg_values_supported?: string[];
	userinfo_encryption_alg_values_supported?: string[];
	userinfo_encryption_enc_values_supported?: string[];
	request_object_signing_alg_values_supported?: string[];
	request_object_encryption_alg_values_supported?: string[];
	request_object_encryption_enc_values_supported?: string[];
	token_endpoint_auth_methods_supported?: string[];
	token_endpoint_auth_signing_alg_values_supported?: string[];
	display_values_supported?: string[];
	claim_types_supported?: string[];
	claims_supported?: string[];
	service_documentation?: string;
	claims_locales_supported?: string[];
	ui_locales_supported?: string[];
	claims_parameter_supported?: boolean;
	request_parameter_supported?: boolean;
	request_uri_parameter_supported?: boolean;
	require_request_uri_registration?: boolean;
	op_policy_uri?: string;
	op_tos_uri?: string;
}

export interface UserInfo {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	middle_name?: string;
	nickname?: string;
	preferred_username?: string;
	profile?: string;
	picture?: string;
	website?: string;
	email?: string;
	email_verified?: boolean;
	gender?: string;
	birthdate?: string;
	zoneinfo?: string;
	locale?: string;
	phone_number?: string;
	phone_number_verified?: boolean;
	address?: {
		formatted?: string;
		street_address?: string;
		locality?: string;
		region?: string;
		postal_code?: string;
		country?: string;
	};
	updated_at?: number;
	roles?: string[];
}
