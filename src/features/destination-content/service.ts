import { environment } from '@/config/env';
import { CONTENT_MAX_BYTES, contentManifestSchema, utf8Length, type ContentManifest } from './model';

export type ContentAccount = Readonly<{ principalId: string; accessToken: string }>;
export type ContentErrorCode = 'content.failed' | 'content.authRequired' | 'content.unavailable' | 'content.timeout' | 'content.saveFailed';
export class ContentError extends Error {
  constructor(readonly code: ContentErrorCode) { super(code); }
}
export type ContentService = (account: ContentAccount, signal: AbortSignal) => Promise<ContentManifest | null>;

async function readBounded(response: Response): Promise<string> {
  const length = response.headers.get('content-length');
  if (length !== null && (!Number.isFinite(Number(length)) || Number(length) < 0 || Number(length) > CONTENT_MAX_BYTES)) throw new ContentError('content.failed');
  // Expo SDK57's default native fetch supports streamed bodies. Check the actual
  // decoded chunks as well as the declared length (which can describe compression).
  if (response.body) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0; let complete = false;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) { complete = true; break; }
        size += value.byteLength;
        if (size > CONTENT_MAX_BYTES) throw new ContentError('content.failed');
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } finally {
      if (!complete) void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  const text = await response.text();
  if (utf8Length(text) > CONTENT_MAX_BYTES) throw new ContentError('content.failed');
  return text;
}

export function createContentService(config: { url: string; key: string }, network: typeof fetch = (input, init) => fetch(input, init)): ContentService {
  return async (account, signal) => {
    if (signal.aborted) throw new ContentError('content.failed');
    if (account.principalId === 'guest' || !account.accessToken) throw new ContentError('content.authRequired');
    let origin: string;
    try { const url = new URL(config.url); if (url.protocol !== 'https:') throw new Error(); origin = url.origin; }
    catch { throw new ContentError('content.unavailable'); }
    const token = account.accessToken;
    const controller = new AbortController();
    let rejectStopped!: (error: ContentError) => void;
    const stopped = new Promise<never>((_, reject) => { rejectStopped = reject; });
    const stop = () => { rejectStopped(new ContentError('content.failed')); controller.abort(); };
    signal.addEventListener('abort', stop, { once: true });
    const timer = setTimeout(() => { rejectStopped(new ContentError('content.timeout')); controller.abort(); }, 15000);
    try {
      const operation = async () => {
        const response = await network(origin + '/rest/v1/rpc/get_destination_content', {
          method: 'POST', body: '{}', redirect: 'error',
          headers: { 'Content-Type': 'application/json', apikey: config.key, Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) throw new ContentError('content.authRequired');
        if (response.status === 404) throw new ContentError('content.unavailable');
        if (!response.ok) throw new ContentError('content.failed');
        const value: unknown = JSON.parse(await readBounded(response));
        return value === null ? null : contentManifestSchema.parse(value);
      };
      return await Promise.race([operation(), stopped]);
    } catch (error) { throw error instanceof ContentError ? error : new ContentError('content.failed'); }
    finally { clearTimeout(timer); signal.removeEventListener('abort', stop); controller.abort(); }
  };
}
export const contentService: ContentService = (account, signal) => environment.success
  ? createContentService(environment.data)(account, signal)
  : Promise.reject(new ContentError('content.unavailable'));
