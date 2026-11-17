import { UPLOADTHING_TOKEN } from '$app/env/private';
import { myRouter } from '#lib/server/uploadthing.ts';

import { createRouteHandler } from 'uploadthing/server';

const handlers = createRouteHandler({
	router: myRouter,
	config: {
		token: UPLOADTHING_TOKEN
	}
});

export { handlers as GET, handlers as POST };
