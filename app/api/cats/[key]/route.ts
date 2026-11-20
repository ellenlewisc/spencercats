import { normalizeCaption } from "@/lib/caption";
import { MAX_CAPTION_LENGTH } from "@/lib/storage";
import { catsBucket, catsTable, jsonError, requireAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ key: string }> };

const MAX_KEY_LENGTH = 512;

export async function PATCH(req: Request, { params }: Context) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;

  const { key } = await params;
  if (!isValidKey(key)) return jsonError("Unknown photo.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Expected a JSON body.", 400);
  }

  const caption = normalizeCaption((body as { caption?: unknown } | null)?.caption);
  if (caption === null) return jsonError(`Captions can be up to ${MAX_CAPTION_LENGTH} characters.`, 400);

  const { data, error } = await catsTable().update({ caption }).eq("key", key).select("key");
  if (error) {
    console.error("Caption update failed:", error);
    return jsonError("Couldn't save the caption.", 500);
  }
  if (data.length === 0) return jsonError("Unknown photo.", 404);

  return Response.json({ key, caption });
}

export async function DELETE(req: Request, { params }: Context) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;

  const { key } = await params;
  if (!isValidKey(key)) return jsonError("Unknown photo.", 404);

  const { data, error } = await catsTable().delete().eq("key", key).select("key");
  if (error) {
    console.error("Delete row failed:", error);
    return jsonError("Couldn't delete the photo.", 500);
  }
  if (data.length === 0) return jsonError("Unknown photo.", 404);

  // The row is gone, so the gallery is consistent even if the file removal below fails.
  const { error: storageError } = await catsBucket().remove([key]);
  if (storageError) console.error(`Row deleted but file ${key} remains in storage:`, storageError);

  return new Response(null, { status: 204 });
}

function isValidKey(key: string): boolean {
  return key.length > 0 && key.length <= MAX_KEY_LENGTH && !key.includes("/") && !key.startsWith(".");
}
