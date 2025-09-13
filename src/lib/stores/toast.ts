import { writable } from 'svelte/store';

export interface ToastMessage {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
	timestamp: number;
}

// 토스트 메시지들을 관리하는 전역 스토어
export const toastStore = writable<ToastMessage[]>([]);

// 토스트 ID 생성을 위한 카운터
let toastIdCounter = 0;

// 토스트 관리 클래스
class ToastManager {
	/**
	 * 새로운 토스트 메시지를 추가합니다
	 */
	show(
		message: string,
		type: 'success' | 'error' | 'info' | 'warning' = 'info',
		duration: number = 4000
	): string {
		const id = `toast-${++toastIdCounter}`;
		const toast: ToastMessage = {
			id,
			message,
			type,
			duration,
			timestamp: Date.now()
		};

		// 스토어에 토스트 추가
		toastStore.update((toasts) => [...toasts, toast]);

		// 지정된 시간 후 자동 제거
		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}

		return id;
	}

	/**
	 * 성공 메시지를 표시합니다
	 */
	success(message: string, duration?: number): string {
		return this.show(message, 'success', duration);
	}

	/**
	 * 에러 메시지를 표시합니다
	 */
	error(message: string, duration?: number): string {
		return this.show(message, 'error', duration || 5000);
	}

	/**
	 * 경고 메시지를 표시합니다
	 */
	warning(message: string, duration?: number): string {
		return this.show(message, 'warning', duration);
	}

	/**
	 * 정보 메시지를 표시합니다
	 */
	info(message: string, duration?: number): string {
		return this.show(message, 'info', duration);
	}

	/**
	 * 특정 토스트를 제거합니다
	 */
	remove(id: string): void {
		toastStore.update((toasts) => toasts.filter((toast) => toast.id !== id));
	}

	/**
	 * 모든 토스트를 제거합니다
	 */
	clear(): void {
		toastStore.set([]);
	}

	/**
	 * 특정 타입의 토스트들을 제거합니다
	 */
	removeByType(type: ToastMessage['type']): void {
		toastStore.update((toasts) => toasts.filter((toast) => toast.type !== type));
	}
}

// 싱글톤 인스턴스 생성
export const toast = new ToastManager();

// 편의를 위한 기본 export
export default toast;
