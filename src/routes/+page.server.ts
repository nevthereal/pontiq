import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolve } from '$app/paths';

export const prerender = true;

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(302, resolve('/(protected)/projects'));
};
