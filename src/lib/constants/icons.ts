/**
 * 아이콘 관련 상수 및 유틸리티 함수
 */

import {
	faCheck,
	faCircle,
	faSpinner,
	faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export const ICONS = {
	// 상태 아이콘
	CHECK: faCheck,
	CIRCLE: faCircle,
	SPINNER: faSpinner,
	EXCLAMATION: faExclamationCircle
} as const;

/**
 * 요구사항 상태에 따른 아이콘 반환
 */
export function getRequirementIcon(met: boolean): IconDefinition {
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
	return `✓ ${message}`;
}

/**
 * 로딩 상태 힌트 메시지 생성
 */
export function createLoadingHint(message: string): string {
	return `⏳ ${message}`;
}
