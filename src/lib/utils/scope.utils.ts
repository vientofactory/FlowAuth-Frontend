import { SCOPE_DESCRIPTIONS } from '../constants/authorization.constants';
import type { ScopeInfo } from '../types/authorization.types';

/**
 * 주어진 스코프 이름에 대한 정보를 반환합니다.
 * 정의되지 않은 스코프의 경우 기본값을 반환합니다.
 */
export function getScopeInfo(scopeName: string): ScopeInfo {
	return (
		SCOPE_DESCRIPTIONS[scopeName] || {
			icon: 'fas fa-question-circle',
			description: `${scopeName} 권한`,
			category: '기타',
			risk: 'low'
		}
	);
}

/**
 * 스코프의 위험도에 따른 색상을 반환합니다.
 */
export function getScopeRiskColor(risk?: 'low' | 'medium' | 'high'): string {
	switch (risk) {
		case 'high':
			return 'bg-red-100 text-red-800';
		case 'medium':
			return 'bg-yellow-100 text-yellow-800';
		case 'low':
		default:
			return 'bg-green-100 text-green-800';
	}
}

/**
 * 스코프의 위험도에 따른 텍스트를 반환합니다.
 */
export function getScopeRiskText(risk?: 'low' | 'medium' | 'high'): string {
	switch (risk) {
		case 'high':
			return '높은 권한';
		case 'medium':
			return '중간 권한';
		case 'low':
		default:
			return '기본 권한';
	}
}
