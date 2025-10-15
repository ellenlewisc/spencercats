import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler() {
  try {
    const { data, error } = await supabase
      .from("CatImages")
      .select("key")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase list error:", error);
      return new Response("Failed to list images", { status: 500 });
    }

    const keys = data.map((row) => row.key);

    return new Response(JSON.stringify(keys), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
