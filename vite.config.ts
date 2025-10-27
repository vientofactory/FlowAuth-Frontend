import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	resolve: {
		alias: {
			'@flowauth/shared': resolve(__dirname, '../shared/src')
		}
	},
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
