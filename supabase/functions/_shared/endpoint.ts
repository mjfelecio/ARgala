import type { z } from 'zod';
import { ApiError } from './errors.ts';
export type Access = { authenticate(token: string): Promise<string | null>; consume(userId: string): Promise<boolean> };
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const MAX_BYTES = 4096;
async function readJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw new ApiError('BODY_TOO_LARGE', 413, 'Request body is too large.');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw new ApiError('INVALID_CONTENT_TYPE', 415, 'Use application/json.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError('INVALID_INPUT', 400, 'A JSON request body is required.');
  const decoder = new TextDecoder(); let text = ''; let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) { await reader.cancel(); throw new ApiError('BODY_TOO_LARGE', 413, 'Request body is too large.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try { return JSON.parse(text); } catch { throw new ApiError('INVALID_INPUT', 400, 'Invalid JSON.'); }
}
export function createEndpoint<T, R>(schema: z.ZodType<T>, action: (input: T) => Promise<R>, access: Access) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      if (request.method !== 'POST') throw new ApiError('METHOD_NOT_ALLOWED', 405, 'Use POST.');
      const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('Authorization') ?? '')?.[1];
      if (!token) throw new ApiError('UNAUTHORIZED', 401, 'Sign in to continue.');
      const userId = await access.authenticate(token);
      if (!userId) throw new ApiError('UNAUTHORIZED', 401, 'Sign in to continue.');
      const parsed = schema.safeParse(await readJson(request));
      if (!parsed.success) throw new ApiError('INVALID_INPUT', 400, 'The request contains invalid fields.');
      if (!await access.consume(userId)) throw new ApiError('RATE_LIMITED', 429, 'Request limit reached. Try again in a minute.');
      return Response.json({ data: await action(parsed.data) }, { headers });
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError('INTERNAL_ERROR', 500, 'The service could not complete this request.');
      return Response.json({ error: { code: failure.code, message: failure.message } }, { status: failure.status, headers: { ...headers, ...(failure.status === 429 ? { 'Retry-After': '60' } : {}) } });
    }
  };
}
