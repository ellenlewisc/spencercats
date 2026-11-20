import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "cat-images";
const BACKUP_DIR = "upload-backup";
const apply = process.argv.includes("--apply");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_KEY must be set (run via `pnpm strip:uploads`).");
  process.exit(1);
}

const storage = createClient(url, key, { auth: { persistSession: false } }).storage.from(BUCKET);

async function listAll() {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await storage.list("", { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    files.push(...data.filter((file) => file.id && !file.name.startsWith(".")));
    if (data.length < 100) return files;
  }
}

function reencode(input, format) {
  const pipeline = sharp(input).rotate();
  if (format === "png") return pipeline.png({ compressionLevel: 9 }).toBuffer();
  if (format === "webp") return pipeline.webp({ quality: 88 }).toBuffer();
  return pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}

const files = await listAll();
let dirty = 0;
let cleaned = 0;

if (apply) await mkdir(BACKUP_DIR, { recursive: true });

for (const file of files) {
  const { data: blob, error } = await storage.download(file.name);
  if (error) {
    console.error(`skip ${file.name}: ${error.message}`);
    continue;
  }
  const input = Buffer.from(await blob.arrayBuffer());
  const meta = await sharp(input).metadata();
  if (!meta.exif && !meta.xmp && !meta.iptc) continue;

  dirty++;
  if (!apply) {
    console.log(`would clean ${file.name} (${meta.format})`);
    continue;
  }

  await writeFile(join(BACKUP_DIR, file.name), input);
  const output = await reencode(input, meta.format);
  const after = await sharp(output).metadata();
  if (after.exif || after.xmp || after.iptc) throw new Error(`Metadata survived re-encoding: ${file.name}`);

  const { error: uploadError } = await storage.upload(file.name, output, {
    upsert: true,
    contentType: file.metadata?.mimetype ?? `image/${meta.format}`,
    cacheControl: "3600",
  });
  if (uploadError) {
    console.error(`failed ${file.name}: ${uploadError.message}`);
    continue;
  }
  cleaned++;
  console.log(`cleaned ${file.name}`);
}

console.log(`\n${files.length} photo(s) checked, ${dirty} had metadata.`);
if (apply) {
  console.log(`${cleaned} cleaned. Originals were saved to ./${BACKUP_DIR}/ and still contain location data: delete that folder once you've checked the site.`);
} else if (dirty > 0) {
  console.log("Dry run only. Re-run with `pnpm strip:uploads --apply` to clean them.");
}
