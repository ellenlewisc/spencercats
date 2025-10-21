export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export async function DELETE(req, { params }) {
  const { id } = params; // id is actually the file key

  if (!id) return new Response("Missing image ID", { status: 400 });

  try {
    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("cat-images")
      .remove([id]);

    if (storageError) {
      console.error("Supabase storage delete error:", storageError);
      return new Response("Failed to delete from storage", { status: 500 });
    }

    // Delete from metadata table using key
    const { error: dbError } = await supabase
      .from("CatImages")
      .delete()
      .eq("key", id);

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
