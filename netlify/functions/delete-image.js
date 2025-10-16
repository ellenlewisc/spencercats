import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const key = event?.queryStringParameters?.key;
  if (!key) {
    return { statusCode: 400, body: "Missing `key` parameter" };
  }

  try {
    // 1️⃣ Get the image record to know its storage path
    const { data: imageData, error: fetchError } = await supabase
      .from("CatImages")
      .select("storage_path")
      .eq("key", key)
      .single();

    if (fetchError || !imageData?.storage_path) {
      return { statusCode: 404, body: "Image not found or missing storage path" };
    }

    const storagePath = imageData.storage_path;

    // 2️⃣ Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("cat-images") // your bucket name
      .remove([storagePath]);

    if (storageError) {
      console.error("Supabase storage delete error:", storageError);
      return { statusCode: 500, body: "Failed to delete from storage" };
    }

    // 3️⃣ Delete from database
    const { error: dbError } = await supabase
      .from("CatImages")
      .delete()
      .eq("key", key);

    if (dbError) {
      console.error("Supabase DB delete error:", dbError);
      return { statusCode: 500, body: "Failed to delete from database" };
    }

    return { statusCode: 200, body: "Deleted successfully" };
  } catch (err) {
    console.error("Delete failed:", err);
    return { statusCode: 500, body: "Failed to delete: " + err.message };
  }
}
