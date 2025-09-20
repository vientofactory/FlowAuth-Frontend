import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import LoadingButton from '$lib/components/ui/LoadingButton.svelte';

describe('LoadingButton', () => {
	it('기본 버튼으로 렌더링된다', () => {
		render(LoadingButton);

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('로딩 상태에서 로딩 텍스트가 표시된다', () => {
		render(LoadingButton, {
			loading: true,
			loadingText: 'Loading...'
		});

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('로딩 상태에서 스피너가 표시된다', () => {
		render(LoadingButton, {
			loading: true,
			loadingText: 'Loading...'
		});

		// LoadingSpinner 컴포넌트가 렌더링되는지 확인
		const spinner = document.querySelector('.animate-spin');
		expect(spinner).toBeInTheDocument();
	});

	it('로딩 상태에서 버튼이 비활성화된다', () => {
		render(LoadingButton, {
			loading: true
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('disabled prop이 올바르게 작동한다', () => {
		render(LoadingButton, {
			disabled: true
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('클릭 이벤트가 올바르게 발생한다', async () => {
		const handleClick = vi.fn();

		render(LoadingButton, {
			onclick: handleClick
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledOnce();
	});

	it('로딩 상태에서 클릭 이벤트가 발생하지 않는다', async () => {
		const handleClick = vi.fn();

		render(LoadingButton, {
			loading: true,
			onclick: handleClick
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(handleClick).not.toHaveBeenCalled();
	});

	it('아이콘이 올바르게 표시된다', () => {
		render(LoadingButton, {
			icon: 'fas fa-plus'
		});

		const icon = document.querySelector('.fas.fa-plus');
		expect(icon).toBeInTheDocument();
	});

	it('다양한 variant가 올바르게 적용된다', () => {
		render(LoadingButton, {
			variant: 'danger'
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('bg-red-600');
	});

	it('다양한 size가 올바르게 적용된다', () => {
		render(LoadingButton, {
			size: 'lg'
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
	});

	it('type 속성이 올바르게 설정된다', () => {
		render(LoadingButton, {
			type: 'submit'
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('type', 'submit');
	});

	it('커스텀 클래스가 올바르게 적용된다', () => {
		render(LoadingButton, {
			class: 'custom-class'
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass('custom-class');
	});
});
