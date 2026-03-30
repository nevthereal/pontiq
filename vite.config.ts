import devToolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { workflowPlugin } from 'workflow/sveltekit';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), workflowPlugin(), devToolsJson()]
});
