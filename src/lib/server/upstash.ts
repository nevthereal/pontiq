import { Redis } from '@upstash/redis';
import { type InferRealtimeEvents, Realtime } from '@upstash/realtime';
import { type UIMessageChunk } from 'ai';
import z from 'zod/v4';
import type { MyUIMessage } from './ai';

export const redis = Redis.fromEnv();

export const schema = {
	ai: { chunk: z.any() as z.ZodType<UIMessageChunk<MyUIMessage>> }
};

export const realtime = new Realtime({ schema, redis });
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
