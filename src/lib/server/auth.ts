import { betterAuth } from 'better-auth';
import * as schema from './db/schema';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { createAuthMiddleware } from 'better-auth/api';
import { autumn } from './autumn';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema
	}),
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		}
	},
	secret: BETTER_AUTH_SECRET,
	user: {
		additionalFields: {
			isApproved: {
				type: 'boolean',
				defaultValue: false,
				fieldName: 'approved'
			}
		}
	},
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith('/callback')) {
				const { newSession } = ctx.context;
				if (newSession) {
					console.log('hit');
					autumn.customers.getOrCreate({
						customerId: newSession.user.id,
						name: newSession.user.name
					});
				}
			}
		})
	}
});

export type Auth = typeof auth;
export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
