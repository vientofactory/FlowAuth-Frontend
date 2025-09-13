import { toast } from '$lib/stores/toast';
import type { ToastMessage } from '$lib/stores/toast';

/**
 * 토스트 관리를 위한 커스텀 훅
 * 컴포넌트에서 토스트를 쉽게 사용할 수 있도록 도움
 */
export function useToast() {
	return {
		/**
		 * 토스트 메시지를 표시합니다
		 */
		show: (message: string, type: ToastMessage['type'] = 'info', duration?: number) =>
			toast.show(message, type, duration),

		/**
		 * 성공 메시지를 표시합니다
		 */
		success: (message: string, duration?: number) => toast.success(message, duration),

		/**
		 * 에러 메시지를 표시합니다
		 */
		error: (message: string, duration?: number) => toast.error(message, duration),

		/**
		 * 경고 메시지를 표시합니다
		 */
		warning: (message: string, duration?: number) => toast.warning(message, duration),

		/**
		 * 정보 메시지를 표시합니다
		 */
		info: (message: string, duration?: number) => toast.info(message, duration),

		/**
		 * 특정 토스트를 제거합니다
		 */
		remove: (id: string) => toast.remove(id),

		/**
		 * 모든 토스트를 제거합니다
		 */
		clear: () => toast.clear(),

		/**
		 * 특정 타입의 토스트들을 제거합니다
		 */
		removeByType: (type: ToastMessage['type']) => toast.removeByType(type)
	};
}
