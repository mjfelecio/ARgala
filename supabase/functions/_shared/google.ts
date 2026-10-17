import { ApiError } from './errors.ts';
export type GoogleDependencies = { key: string; fetcher: typeof fetch };
export async function googleJson(url: string, options: RequestInit, dependencies: GoogleDependencies): Promise<unknown> {
  if (!dependencies.key) throw new ApiError('SERVICE_NOT_CONFIGURED', 503, 'The provider service is not configured.');
  try {
    const response = await dependencies.fetcher(url, { ...options, headers: { ...options.headers, 'X-Goog-Api-Key': dependencies.key }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new ApiError('UPSTREAM_ERROR', response.status === 429 ? 503 : 502, 'The provider request failed. Please try again.');
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('UPSTREAM_UNAVAILABLE', 502, 'The provider is unavailable or returned invalid data.');
  }
}
