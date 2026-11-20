import sharp from "sharp";
import { normalizeCaption } from "@/lib/caption";
import { DEFAULT_PAGE_SIZE, MAX_CAPTION_LENGTH, MAX_IMAGE_DIMENSION, MAX_PAGE_SIZE, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { catsBucket, catsTable, jsonError, requireAdmin, toCatImage } from "@/lib/supabase-server";
import type { CatImage, CatPage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "heif"]);
const MAX_INPUT_PIXELS = 60_000_000;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = clampInt(searchParams.get("limit"), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE);
  const before = searchParams.get("before");

  let query = catsTable()
    .select("key, caption, uploaded_at")
    .order("uploaded_at", { ascending: false })
    .limit(limit);

  if (before) {
    if (Number.isNaN(Date.parse(before))) return jsonError("Invalid cursor.", 400);
    query = query.lt("uploaded_at", before);
  }

  const { data, error } = await query;
  if (error) {
    console.error("List cats failed:", error);
    return jsonError("Couldn't load the cats.", 500);
  }

  const cats = data.map(toCatImage);
  const body: CatPage = {
    cats,
    nextCursor: cats.length === limit ? (cats.at(-1)?.uploadedAt ?? null) : null,
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth.response) return auth.response;

  const declaredSize = Number(req.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) return tooLarge();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("That upload couldn't be read.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError("Please attach a photo.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return tooLarge();

  const caption = normalizeCaption(form.get("caption"));
  if (caption === null) return jsonError(`Captions can be up to ${MAX_CAPTION_LENGTH} characters.`, 400);

  let image: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const { format } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
    if (!format || !ACCEPTED_FORMATS.has(format)) {
      return jsonError("Only JPEG, PNG, WebP, GIF or AVIF photos can be uploaded.", 415);
    }
    // Re-encoding drops all EXIF/XMP metadata, including GPS location; rotate() keeps the photo upright first.
    image = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return jsonError("That file isn't a photo we can read.", 415);
  }

  const key = `${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await catsBucket().upload(key, image, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return jsonError("Couldn't save the photo.", 500);
  }

  const { data, error: dbError } = await catsTable()
    .insert({ key, storage_path: key, caption })
    .select("key, caption, uploaded_at")
    .single();
  if (dbError) {
    console.error("Insert failed, removing uploaded file:", dbError);
    await catsBucket().remove([key]);
    return jsonError("Couldn't save the photo.", 500);
  }

  const cat: CatImage = toCatImage(data);
  return Response.json(cat, { status: 201 });
}

function tooLarge(): Response {
  return jsonError(`Photos can be up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`, 413);
}

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}
