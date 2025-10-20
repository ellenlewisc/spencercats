
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from("CatImages")
      .select("key")
      .order("uploaded_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const urlPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/cat-images`;
    const withUrls = data.map((item) => ({
      key: item.key,
      url: `${urlPrefix}/${item.key}`,
    }));

    return Response.json({ data: withUrls }, { status: 200 });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
