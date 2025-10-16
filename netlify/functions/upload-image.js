import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const formData = await req.formData();
    const fileUpload = formData.get("fileUpload");

    if (!fileUpload) {
      console.error("upload-image error: No file uploaded");
      return new Response("No file uploaded", { status: 400 });
    }

    // Generate a unique filename
    const fileName = `${Date.now()}-${fileUpload.name}`;

    // Upload to Supabase Storage (using the "cat-images" bucket)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cat-images")
      .upload(fileName, fileUpload, {
        cacheControl: "3600",
        upsert: false, // Prevent overwriting existing files
      });

    if (uploadError) throw uploadError;

    // Store file metadata in Supabase table
    const { error: dbError } = await supabase
      .from("CatImages")
      .insert([
        {
          key: fileName,
          storage_path: uploadData.path,
        },
      ]);

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return new Response("Failed to save metadata", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, path: uploadData.path }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
