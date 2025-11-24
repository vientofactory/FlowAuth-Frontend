import { writable } from 'svelte/store';

export interface ApiRequestState {
	isLoading: boolean;
	activeRequests: number;
}

function createApiRequestStore() {
	const { subscribe, set, update } = writable<ApiRequestState>({
		isLoading: false,
		activeRequests: 0
	});

	return {
		subscribe,
		startRequest: () => {
			update((state) => {
				const newActiveRequests = state.activeRequests + 1;
				return {
					isLoading: newActiveRequests > 0,
					activeRequests: newActiveRequests
				};
			});
		},
		endRequest: () => {
			update((state) => {
				const newActiveRequests = Math.max(0, state.activeRequests - 1);
				return {
					isLoading: newActiveRequests > 0,
					activeRequests: newActiveRequests
				};
			});
		},
		reset: () => {
			set({
				isLoading: false,
				activeRequests: 0
			});
		}
	};
}

export const apiRequestStore = createApiRequestStore();
