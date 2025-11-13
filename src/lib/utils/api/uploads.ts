import { BaseApi } from './base';
import { API_ENDPOINTS } from '$lib/constants/app.constants';

export class UploadsApi extends BaseApi {
	async uploadLogo(file: File): Promise<{
		success: boolean;
		message: string;
		data: { filename: string; url: string; originalName: string; size: number; mimetype: string };
	}> {
		const formData = new FormData();
		formData.append('logo', file);

		// FormData를 사용할 때는 Content-Type 헤더를 설정하지 않음 (브라우저가 자동으로 설정)
		return this.request(API_ENDPOINTS.UPLOADS.LOGO, {
			method: 'POST',
			body: formData,
			headers: {} // Content-Type을 제거하여 브라우저가 multipart/form-data로 자동 설정하도록 함
		});
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
		return this.request(`${API_ENDPOINTS.UPLOADS.CONFIG}/${type}`);
	}
}
