import { requestUrl } from 'obsidian';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';

class RequestError extends Error {
  constructor(public readonly status: number) {
    super(`Memos request returned HTTP ${status}`);
  }
}

export function isMissingEndpoint(error: unknown) {
  if (typeof error !== 'object' || !error) return false;
  const status = (error as { status?: number }).status;
  return status === 404 || status === 410 || status === 501;
}

export async function customRequest<T>(
  options: RequestUrlParam & {
    params?: Record<string, string>;
  },
): Promise<Omit<RequestUrlResponse, 'json'> & { json: T }> {
  const { params, ...request } = options;
  const query = new URLSearchParams(params).toString();
  const response = await requestUrl({
    ...request,
    url: query ? `${request.url}?${query}` : request.url,
    throw: false,
  });
  if (response.status < 200 || response.status >= 300) throw new RequestError(response.status);
  return response;
}
