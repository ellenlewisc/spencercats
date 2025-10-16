import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler() {
  try {
    // Fetch key and value from Supabase
    const { data, error } = await supabase
      .from("CatImages")
      .select("key, value")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Supabase list error:", error);
      return new Response("Failed to list images", { status: 500 });
    }

    // Return array of objects like: [{ key: "...", value: "..." }, ...]
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
