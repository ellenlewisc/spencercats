import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Fetch from your table
    const { data, error } = await supabase
      .from("CatImages")
      .select("key")
      .order("uploaded_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Construct public URLs
    const urlPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/cat-images`;
    const withUrls = data.map((item) => ({
      key: item.key,
      url: `${urlPrefix}/${item.key}`,
    }));

    return new Response(JSON.stringify({ data: withUrls }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
