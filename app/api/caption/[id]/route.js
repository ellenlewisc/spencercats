import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function getAuthUser(req) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("sb-access-token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user } } = await authClient.auth.getUser(token);
  return user;
}

export async function PATCH(req, { params }) {
  const { id } = await params;

  if (!id) return new Response("Missing image ID", { status: 400 });

  try {
    const user = await getAuthUser(req);
    if (!user) return new Response("Unauthorized", { status: 401 });
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
