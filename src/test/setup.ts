import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// 각 테스트 후 DOM 정리
beforeEach(() => {
	cleanup();
});
