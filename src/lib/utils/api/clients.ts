import type { Client } from '$lib/types/oauth.types';
import { BaseApi } from './base';

export interface CreateClientData {
	name: string;
	description?: string;
	redirectUris: string[];
	grants: string[];
	scopes?: string[];
	logoUri?: string;
	termsOfServiceUri?: string;
	policyUri?: string;
	recaptchaToken: string;
}

export class ClientsApi extends BaseApi {
	async getClients(): Promise<Client[]> {
		return this.request('/auth/clients');
	}

	async createClient(data: CreateClientData) {
		return this.request('/auth/clients', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	async getClient(id: number): Promise<Client> {
		return this.request(`/auth/clients/${id}`);
	}

	async updateClient(id: number, data: Partial<CreateClientData>) {
		return this.request(`/auth/clients/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	async updateClientStatus(id: number, isActive: boolean) {
		return this.request(`/auth/clients/${id}/status`, {
			method: 'PATCH',
			body: JSON.stringify({ isActive })
		});
	}

	async deleteClient(id: number) {
		return this.request(`/auth/clients/${id}`, {
			method: 'DELETE'
		});
	}

	async resetClientSecret(id: number) {
		return this.request(`/auth/clients/${id}/reset-secret`, {
			method: 'PUT'
		});
	}

	async removeClientLogo(id: number) {
		return this.request(`/auth/clients/${id}/logo`, {
			method: 'DELETE'
		});
	}
}
