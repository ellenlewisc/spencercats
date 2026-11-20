import { getBrowserClient } from "./supabase-browser";
import type { ApiError, CatImage, CatPage } from "./types";

export async function fetchCats(before: string | null, signal?: AbortSignal): Promise<CatPage> {
  const params = new URLSearchParams();
  if (before) params.set("before", before);
  return request<CatPage>(`/api/cats?${params}`, { signal });
}

export async function fetchIsAdmin(): Promise<boolean> {
  const { isAdmin } = await request<{ isAdmin: boolean }>("/api/me", { headers: await authHeaders() });
  return isAdmin;
}

export async function uploadCat(file: Blob, fileName: string, caption: string): Promise<CatImage> {
  const form = new FormData();
  form.append("file", file, fileName);
  form.append("caption", caption);
  return request<CatImage>("/api/cats", { method: "POST", headers: await authHeaders(), body: form });
}

export async function updateCaption(key: string, caption: string): Promise<void> {
  await request(`/api/cats/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ caption }),
  });
}

export async function deleteCat(key: string): Promise<void> {
  await request(`/api/cats/${encodeURIComponent(key)}`, { method: "DELETE", headers: await authHeaders() });
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await getBrowserClient().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
