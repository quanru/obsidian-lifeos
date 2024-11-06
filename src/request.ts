import { requestUrl } from 'obsidian';
import type { RequestUrlParam, RequestUrlResponse } from 'obsidian';

export async function customRequest<T>(
  options: RequestUrlParam & {
    params?: Record<string, string>;
  },
): Promise<Omit<RequestUrlResponse, 'json'> & { json: T }> {
  const queryParams = new URLSearchParams(options.params).toString();
  const url = `${options.url}?${queryParams}`;

  try {
    const response = await requestUrl({
      ...options,
      url,
    });
    return response;
  } catch (error) {
    console.error('Request error:', options.url, error);
    throw error;
  }
}
