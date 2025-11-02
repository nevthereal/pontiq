import { UPLOADTHING_TOKEN } from '$env/static/private';
import { myRouter } from '$lib/server/uploadthing';

import { createRouteHandler } from 'uploadthing/server';

const handlers = createRouteHandler({
	router: myRouter,
	config: {
		token: UPLOADTHING_TOKEN
	}
});

export { handlers as GET, handlers as POST };
