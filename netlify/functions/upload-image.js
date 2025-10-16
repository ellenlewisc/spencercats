import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req) {
  try {
    const formData = await req.formData();
    const fileUpload = formData.get("fileUpload");

    if (!fileUpload) {
      console.error("upload-image error: No file uploaded");
      return new Response("No file uploaded", { status: 400 });
    }

    console.info("Incoming file:", fileUpload.name);
    console.info("Size (bytes):", fileUpload.size);
    console.info("Type:", fileUpload.type);

    const catStore = getStore({ name: "Cats", consistency: "strong" });

    // Generate unique key
    const key = `${Date.now()}-${fileUpload.name}`;

    // Save to Netlify Blobs
    await catStore.set(key, fileUpload);
    console.info("Upload successful:", key);

    // 🔹 Convert file to Base64 string for Supabase
    const arrayBuffer = await fileUpload.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Value = buffer.toString("base64");

    // 🔹 Store both key and base64 value in Supabase
    const { error } = await supabase
      .from("CatImages")
      .insert([{ key, value: base64Value }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response("Failed to save metadata", { status: 500 });
    }

    console.info("Supabase insert successful:", key);

    return new Response(JSON.stringify({ key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
