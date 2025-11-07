import { BaseApi } from './base';

export interface EmailQueueStats {
	active: number;
	waiting: number;
	completed: number;
	failed: number;
	delayed: number;
	paused: number;
}

export interface EmailTestRequest {
	to: string;
	templateName: string;
	username: string;
}

export interface SMTPConnectionStatus {
	success: boolean;
	message: string;
}

export interface SMTPInfo {
	connected: boolean;
	host: string;
	port: number;
	auth: string;
	secure: boolean;
	lastChecked: string;
}

export class EmailApi extends BaseApi {
	// SMTP 연결 테스트
	async testConnection(): Promise<SMTPConnectionStatus> {
		return this.request<SMTPConnectionStatus>('/email/test-connection');
	}

	// SMTP 연결 정보 조회
	async getSmtpInfo(): Promise<SMTPInfo> {
		return this.request<SMTPInfo>('/email/smtp-info');
	}

	// 테스트 이메일 전송
	async sendTestEmail(data: EmailTestRequest): Promise<{ message: string }> {
		return this.request<{ message: string }>('/email/test-send', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// 큐 상태 조회
	async getQueueStats(): Promise<EmailQueueStats> {
		return this.request<EmailQueueStats>('/email/queue/stats');
	}

	// 실패한 작업 재시도
	async retryFailedJobs(limit?: number): Promise<{ retriedCount: number }> {
		const params = limit ? `?limit=${limit}` : '';
		return this.request<{ retriedCount: number }>(`/email/queue/retry-failed${params}`, {
			method: 'POST'
		});
	}

	// 큐 정리
	async cleanQueue(
		grace?: number,
		limit?: number
	): Promise<{
		message: string;
		cleanedCompleted: number;
		cleanedFailed: number;
		totalCleaned: number;
	}> {
		const params = new URLSearchParams();
		if (grace) params.append('grace', grace.toString());
		if (limit) params.append('limit', limit.toString());
		const queryString = params.toString() ? `?${params.toString()}` : '';

		return this.request<{
			message: string;
			cleanedCompleted: number;
			cleanedFailed: number;
			totalCleaned: number;
		}>(`/email/queue/clean${queryString}`, {
			method: 'POST'
		});
	}

	// 큐 일시정지
	async pauseQueue(): Promise<{ message: string }> {
		return this.request<{ message: string }>('/email/queue/pause', {
			method: 'POST'
		});
	}

	// 큐 재개
	async resumeQueue(): Promise<{ message: string }> {
		return this.request<{ message: string }>('/email/queue/resume', {
			method: 'POST'
		});
	}

	// 특정 작업 제거
	async removeJob(jobId: string): Promise<{ success: boolean; message: string }> {
		return this.request<{ success: boolean; message: string }>(`/email/queue/job/${jobId}`, {
			method: 'DELETE'
		});
	}

	// 큐 완전 비우기
	async purgeQueue(): Promise<{ message: string }> {
		return this.request<{ message: string }>('/email/queue/purge', {
			method: 'DELETE'
		});
	}
}
