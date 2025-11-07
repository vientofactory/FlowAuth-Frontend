import { BaseApi } from './base';

export class UploadsApi extends BaseApi {
	async uploadLogo(file: File): Promise<{
		success: boolean;
		message: string;
		data: { filename: string; url: string; originalName: string; size: number; mimetype: string };
	}> {
		const formData = new FormData();
		formData.append('logo', file);

		const config: RequestInit = {
			method: 'POST',
			body: formData,
			credentials: 'include'
		};

		const token = this.getToken();
		if (token) {
			config.headers = {
				Authorization: `Bearer ${token}`
			};
		}

		const url = `${this.baseURL}/uploads/logo`;

		try {
			const response = await fetch(url, config);

			if (response.status === 401) {
				this.removeToken();
				if (typeof window !== 'undefined') {
					window.location.href = '/auth/login';
				}
				throw new Error('Authentication required');
			}

			if (!response.ok) {
				const errorData = await this.parseErrorResponse(response);
				throw this.createErrorFromResponse(errorData, response.status);
			}

			return await response.json();
		} catch (error) {
			if (
				error instanceof TypeError ||
				(error as Error & { name?: string }).name === 'NetworkError'
			) {
				throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
			}
			throw error;
		}
	}

	async getCurrentLogo(): Promise<{ url: string }> {
		return this.request<{ url: string }>('/uploads/logo/current');
	}

	async getUploadConfig(type: string): Promise<{
		allowedMimes: readonly string[];
		maxSize: number;
		maxSizeMB: number;
		destination: string;
		supportedFormats?: string;
		recommendedSize?: {
			width: number;
			height: number;
		};
		aspectRatio?: string;
		resizeFit?: string;
		resizePosition?: string;
		optimization?: {
			outputFormats: readonly string[];
			quality: {
				jpeg: number;
				webp: number;
				avif: number;
			};
		};
	}> {
		return this.request(`/uploads/config/${type}`);
	}
}
