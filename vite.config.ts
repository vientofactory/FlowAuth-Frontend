import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Group vendor dependencies
					if (id.includes('node_modules')) {
						if (id.includes('svelte')) {
							return 'vendor';
						}
						if (id.includes('qrcode') || id.includes('lucide')) {
							return 'ui';
						}
					}
				}
			}
		}
	},
	// Optimize dependencies
	optimizeDeps: {
		include: ['qrcode']
	}
});
