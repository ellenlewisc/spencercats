import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req) {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const formData = await req.formData();
    const fileUpload = formData.get("fileUpload");

    if (!fileUpload) {
      console.error("upload-image error: No file uploaded");
      return new Response("No file uploaded", { status: 400 });
    }
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cat-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;


    // 🔹 Store both key and base64 value in Supabase
    const { error } = await supabase
      .from("CatImages")
      .insert([{ key: fileName, storage_path: uploadData.path }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response("Failed to save metadata", { status: 500 });
    }


    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
