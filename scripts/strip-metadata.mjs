import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const [sourceDir = "public/images", targetDir = sourceDir] = process.argv.slice(2);

async function stripFile(sourcePath, targetPath) {
  const input = await readFile(sourcePath);
  const ext = extname(sourcePath).toLowerCase();

  // rotate() bakes the EXIF orientation into the pixels before the metadata is dropped.
  let pipeline = sharp(input).rotate();
  if (ext === ".png") pipeline = pipeline.png({ compressionLevel: 9 });
  else if (ext === ".webp") pipeline = pipeline.webp({ quality: 88 });
  else pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });

  const output = await pipeline.toBuffer();
  const after = await sharp(output).metadata();
  if (after.exif || after.xmp || after.iptc) {
    throw new Error(`Metadata survived re-encoding: ${sourcePath}`);
  }

  await writeFile(targetPath, output);
  return { before: input.length, after: output.length };
}

await mkdir(targetDir, { recursive: true });
const files = (await readdir(sourceDir)).filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()));

for (const file of files) {
  const { before, after } = await stripFile(join(sourceDir, file), join(targetDir, file));
  console.log(`${file}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB, metadata removed`);
}

console.log(`Done: ${files.length} file(s).`);
