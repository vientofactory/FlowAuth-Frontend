import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FormField from '$lib/components/form/FormField.svelte';

describe('FormField', () => {
	it('기본 속성으로 렌더링된다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Label',
			value: 'test value'
		});

		expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
		expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
	});

	it('필수 필드 표시가 올바르게 작동한다', () => {
		render(FormField, {
			name: 'test',
			label: 'Required Field',
			value: '',
			required: true
		});

		const input = screen.getByLabelText('Required Field');
		expect(input).toHaveAttribute('required');
	});

	it('에러 메시지가 표시된다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			error: 'This field is required'
		});

		expect(screen.getByText('This field is required')).toBeInTheDocument();
		expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
	});

	it('힌트 메시지가 표시된다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			hint: 'This is a helpful hint'
		});

		expect(screen.getByText('This is a helpful hint')).toBeInTheDocument();
	});

	it('disabled 상태가 올바르게 작동한다', () => {
		render(FormField, {
			name: 'test',
			label: 'Disabled Field',
			value: '',
			disabled: true
		});

		const input = screen.getByLabelText('Disabled Field');
		expect(input).toBeDisabled();
	});

	it('input 이벤트가 올바르게 발생한다', async () => {
		const handleInput = vi.fn();

		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			oninput: handleInput
		});

		const input = screen.getByLabelText('Test Field');
		await fireEvent.input(input, { target: { value: 'new value' } });

		expect(handleInput).toHaveBeenCalled();
	});

	it('다양한 input 타입이 올바르게 작동한다', () => {
		render(FormField, {
			name: 'email',
			label: 'Email Field',
			value: '',
			type: 'email'
		});

		const input = screen.getByLabelText('Email Field');
		expect(input).toHaveAttribute('type', 'email');
	});

	it('placeholder가 올바르게 표시된다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			placeholder: 'Enter your text here'
		});

		expect(screen.getByPlaceholderText('Enter your text here')).toBeInTheDocument();
	});

	it('아이콘이 있을 때 올바르게 렌더링된다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			icon: 'fas fa-user'
		});

		const icon = document.querySelector('.fas.fa-user');
		expect(icon).toBeInTheDocument();
	});

	it('에러가 있을 때 힌트가 숨겨진다', () => {
		render(FormField, {
			name: 'test',
			label: 'Test Field',
			value: '',
			error: 'Error message',
			hint: 'This hint should be hidden'
		});

		expect(screen.getByText('Error message')).toBeInTheDocument();
		expect(screen.queryByText('This hint should be hidden')).not.toBeInTheDocument();
	});
});
