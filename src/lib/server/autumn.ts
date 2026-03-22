import { AUTUMN_SECRET_KEY } from '$env/static/private';
import { Autumn } from 'autumn-js';

export const autumn = new Autumn({
	secretKey: AUTUMN_SECRET_KEY
});
