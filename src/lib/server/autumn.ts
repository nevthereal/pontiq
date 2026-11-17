import { AUTUMN_SECRET_KEY } from '$app/env/private';
import { Autumn } from 'autumn-js';

export const autumn = new Autumn({
	secretKey: AUTUMN_SECRET_KEY
});
