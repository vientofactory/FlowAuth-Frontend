import type { Client } from '$lib/types/oauth.types';
import { createApiUrl } from '$lib/config/env';
import type { PageLoad } from './$types';

export interface ConsentPageData {
	client: Client;
	scopes: string[];
	authorizeParams: {
		client_id: string;
		redirect_uri: string;
		response_type: string;
		scope?: string;
		state?: string;
		code_challenge?: string;
		code_challenge_method?: string;
	};
}

export const load: PageLoad = async ({ url, fetch }) => {
	const client_id = url.searchParams.get('client_id');
	const redirect_uri = url.searchParams.get('redirect_uri');
	const response_type = url.searchParams.get('response_type');
	const scope = url.searchParams.get('scope');
	const state = url.searchParams.get('state');
	const code_challenge = url.searchParams.get('code_challenge');
	const code_challenge_method = url.searchParams.get('code_challenge_method');

	if (!client_id || !redirect_uri || !response_type) {
		throw new Error('Missing required OAuth2 parameters');
	}

	try {
		// Call backend authorize endpoint to validate request and get client info
		const response = await fetch(createApiUrl(`/oauth/authorize?${url.searchParams.toString()}`), {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			throw new Error('Authorization request validation failed');
		}

		const data = await response.json();

		return {
			client: data.client,
			scopes: data.scopes,
			authorizeParams: {
				client_id,
				redirect_uri,
				response_type,
				scope,
				state,
				code_challenge,
				code_challenge_method
			}
		} as ConsentPageData;
	} catch (error) {
		console.error('Failed to load consent page data:', error);
		throw error;
	}
};
