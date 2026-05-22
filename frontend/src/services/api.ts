import type { ApiResponse } from "../types/api";

const API_BASE_URL = "/api/v1";

async function parseError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return new Error(payload.detail ?? payload.message ?? `Request failed with status ${response.status}`);
  } catch {
    return new Error(`Request failed with status ${response.status}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

export async function apiPost<TResponse, TPayload>(path: string, body: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as ApiResponse<TResponse>;
  return payload.data;
}

export async function apiPut<TResponse, TPayload>(path: string, body: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as ApiResponse<TResponse>;
  return payload.data;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  if (!response.ok) {
    throw await parseError(response);
  }
}
