import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function PATCH(req, { params }) {
  const { id } = params;

  if (!id) return new Response("Missing image ID", { status: 400 });

  try {
    const { caption } = await req.json();

    const { error } = await supabase
      .from("CatImages")
      .update({ caption: caption || "" })
      .eq("key", id);

    if (error) {
      console.error("Caption update error:", error);
      return new Response("Failed to update caption", { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Caption update failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
