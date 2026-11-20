import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { BUCKET, TABLE } from "./storage";
import type { CatImage, Database } from "./types";

let serviceClient: SupabaseClient<Database> | null = null;

export function getServiceClient(): SupabaseClient<Database> {
  serviceClient ??= createClient<Database>(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

export function toCatImage(row: { key: string; caption: string | null; uploaded_at: string }): CatImage {
  const { publicUrl } = getServiceClient().storage.from(BUCKET).getPublicUrl(row.key).data;
  return { key: row.key, url: publicUrl, caption: row.caption ?? "", uploadedAt: row.uploaded_at };
}

export function catsTable() {
  return getServiceClient().from(TABLE);
}

export function catsBucket() {
  return getServiceClient().storage.from(BUCKET);
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!match?.[1]) return null;
  const { data, error } = await getServiceClient().auth.getUser(match[1]);
  return error ? null : data.user;
}

export function isAdmin(user: User): boolean {
  if (!user.email || !user.email_confirmed_at) return false;
  return adminEmails().has(user.email.toLowerCase());
}

type AdminCheck = { user: User; response?: undefined } | { user?: undefined; response: Response };

export async function requireAdmin(req: Request): Promise<AdminCheck> {
  const user = await getUserFromRequest(req);
  if (!user) return { response: jsonError("Please sign in first.", 401) };
  if (!isAdmin(user)) return { response: jsonError("This account can't change the gallery.", 403) };
  return { user };
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}
