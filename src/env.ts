import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	VERCEL_AI_KEY: { static: true },
	UPLOADTHING_TOKEN: { static: true },
	EXA_API_KEY: { static: true },
	BETTER_AUTH_SECRET: { static: true },
	GOOGLE_CLIENT_ID: { static: true },
	GOOGLE_CLIENT_SECRET: { static: true },
	AUTUMN_SECRET_KEY: { static: true },
	DATABASE_URL: { schema: (input) => input ?? '' }
});
