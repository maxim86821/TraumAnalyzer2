
interface ApiRequestOptions {
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest(
  method: string,
  endpoint: string,
  options: ApiRequestOptions = {}
) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  return response;
}
