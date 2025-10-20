export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id) {
    return new Response("Missing image ID", { status: 400 });
  }

  try {
    // 1️⃣ Get the storage path (optional if you only store key)
    const { data: imageData, error: fetchError } = await supabase
      .from("CatImages")
      .select("key")
      .eq("id", id)
      .single();

    if (fetchError || !imageData?.key) {
      return new Response("Image not found", { status: 404 });
    }

    const fileKey = imageData.key;

    // 2️⃣ Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("cat-images")
      .remove([fileKey]);

    if (storageError) {
      console.error("Supabase storage delete error:", storageError);
      return new Response("Failed to delete from storage", { status: 500 });
    }

    // 3️⃣ Delete from your metadata table
    const { error: dbError } = await supabase
      .from("CatImages")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Supabase DB delete error:", dbError);
      return new Response("Failed to delete from database", { status: 500 });
    }

    return new Response("Deleted successfully", { status: 200 });
  } catch (err) {
    console.error("Delete failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
