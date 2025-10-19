/**
 * 아이콘 관련 상수 및 유틸리티 함수
 */

export const ICONS = {
	// 상태 아이콘
	CHECK: '<i class="fas fa-check text-green-600"></i>',
	CIRCLE: '<i class="far fa-circle text-gray-400"></i>',
	SPINNER: '<i class="fas fa-spinner fa-spin"></i>',
	EXCLAMATION: '<i class="fas fa-exclamation-circle"></i>',

	// 인라인 스타일 아이콘 (클래스명만)
	CHECK_CLASS: 'fas fa-check',
	CIRCLE_CLASS: 'far fa-circle',
	SPINNER_CLASS: 'fas fa-spinner fa-spin',
	EXCLAMATION_CLASS: 'fas fa-exclamation-circle'
} as const;

/**
 * 요구사항 상태에 따른 아이콘 반환
 */
export function getRequirementIcon(met: boolean): string {
	return met ? ICONS.CHECK : ICONS.CIRCLE;
}

/**
 * 요구사항 상태에 따른 스타일 클래스 반환
 */
export function getRequirementStatus(met: boolean): string {
	return met ? 'text-green-600' : 'text-gray-500';
}

/**
 * 성공 상태 힌트 메시지 생성
 */
export function createSuccessHint(message: string): string {
	return `${ICONS.CHECK} ${message}`;
}

/**
 * 로딩 상태 힌트 메시지 생성
 */
export function createLoadingHint(message: string): string {
	return `${ICONS.SPINNER} ${message}`;
}
