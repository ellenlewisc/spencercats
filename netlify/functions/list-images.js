import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("CatImages")
      .select("key, storage_path")
      .order("uploaded_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const images = data
      .filter(img => img.storage_path) // skip null/undefined paths
      .map(img => {
        const { publicUrl } = supabase.storage
          .from("cat-images")
          .getPublicUrl(img.storage_path);
        return { key: img.key, url: publicUrl };
      });


    return new Response(JSON.stringify({ data: images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
