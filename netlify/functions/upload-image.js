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

    // Generate a unique key for the file
    const key = `${Date.now()}-${fileUpload.name}`;

    // Save the file to the store
    await catStore.set(key, fileUpload);

    console.info("Upload successful:", key);

    const { error } = await supabase.from("cats").insert([{ key }]);

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
