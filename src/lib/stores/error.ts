import { writable } from 'svelte/store';
import type { ApiError } from '$lib/utils/error-handler';
import { handleFetchError, handleJavaScriptError, logError } from '$lib/utils/error-handler';

// 에러 토스트 상태 인터페이스
export interface ErrorToast extends ApiError {
	id: string;
	showActions: boolean;
	autoClose: boolean;
	closeDuration: number;
}

// 전역 에러 토스트 스토어
export const errorToasts = writable<ErrorToast[]>([]);

// 에러 토스트 ID 카운터
let toastIdCounter = 0;

class ErrorManager {
	/**
	 * 새로운 에러 토스트 추가
	 */
	addError(
		error: ApiError,
		options: {
			showActions?: boolean;
			autoClose?: boolean;
			closeDuration?: number;
		} = {}
	): string {
		const id = `error-${++toastIdCounter}`;
		const toast: ErrorToast = {
			...error,
			id,
			showActions: options.showActions ?? true,
			autoClose: options.autoClose ?? this.shouldAutoClose(error.status),
			closeDuration: options.closeDuration ?? this.getDefaultCloseDuration(error.status)
		};

		errorToasts.update((toasts) => [...toasts, toast]);
		logError(error, 'Toast');

		// 자동 닫기가 활성화된 경우 자동 제거
		if (toast.autoClose) {
			setTimeout(() => {
				this.removeError(id);
			}, toast.closeDuration);
		}

		return id;
	}

	/**
	 * 에러 토스트 제거
	 */
	removeError(id: string): void {
		errorToasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
	}

	/**
	 * 모든 에러 토스트 제거
	 */
	clearAll(): void {
		errorToasts.set([]);
	}

	/**
	 * fetch 응답 에러 처리
	 */
	async handleFetchError(
		response: Response,
		options?: { showActions?: boolean; autoClose?: boolean; closeDuration?: number }
	): Promise<string> {
		const error = await handleFetchError(response);
		return this.addError(error, options);
	}

	/**
	 * JavaScript 에러 처리
	 */
	handleJavaScriptError(
		jsError: Error,
		options?: { showActions?: boolean; autoClose?: boolean; closeDuration?: number }
	): string {
		const error = handleJavaScriptError(jsError);
		return this.addError(error, options);
	}

	/**
	 * 간단한 에러 메시지로 토스트 생성
	 */
	showError(
		message: string,
		status = 500,
		options?: { showActions?: boolean; autoClose?: boolean; closeDuration?: number }
	): string {
		const error: ApiError = {
			status,
			message,
			code: `CUSTOM_${status}`,
			timestamp: new Date().toISOString()
		};
		return this.addError(error, options);
	}

	/**
	 * 네트워크 에러 전용 토스트
	 */
	showNetworkError(message = '네트워크 연결을 확인해주세요.'): string {
		return this.showError(message, 0, {
			showActions: true,
			autoClose: false
		});
	}

	/**
	 * 인증 에러 전용 토스트
	 */
	showAuthError(message = '로그인이 필요합니다.'): string {
		return this.showError(message, 401, {
			showActions: true,
			autoClose: false
		});
	}

	/**
	 * 권한 에러 전용 토스트
	 */
	showPermissionError(message = '이 작업을 수행할 권한이 없습니다.'): string {
		return this.showError(message, 403, {
			showActions: true,
			autoClose: false
		});
	}

	/**
	 * 검증 에러 전용 토스트
	 */
	showValidationError(message = '입력한 데이터에 문제가 있습니다.'): string {
		return this.showError(message, 422, {
			showActions: false,
			autoClose: true,
			closeDuration: 5000
		});
	}

	/**
	 * 상태 코드에 따라 자동 닫기 여부 결정
	 */
	private shouldAutoClose(status: number): boolean {
		// 네트워크, 인증, 권한 에러는 수동으로 닫기
		if (status === 0 || status === 401 || status === 403) {
			return false;
		}
		// 검증 에러나 일반적인 클라이언트 에러는 자동 닫기
		if (status >= 400 && status < 500) {
			return true;
		}
		// 서버 에러는 수동으로 닫기
		if (status >= 500) {
			return false;
		}
		return true;
	}

	/**
	 * 상태 코드에 따른 기본 닫기 지연 시간 반환
	 */
	private getDefaultCloseDuration(status: number): number {
		if (status === 422 || status === 400) {
			return 5000; // 검증 에러는 5초
		}
		if (status >= 400 && status < 500) {
			return 4000; // 클라이언트 에러는 4초
		}
		return 6000; // 기본값 6초
	}
}

// 싱글톤 인스턴스 생성
export const errorManager = new ErrorManager();

// 편의를 위한 export
export default errorManager;
