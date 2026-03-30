
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

export async function POST(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) return new Response("Unauthorized", { status: 401 });
    const formData = await req.formData();
    const fileUpload = formData.get("fileUpload");
    const caption = formData.get("caption") || ""; // ← read caption

    if (!fileUpload) {
      console.error("upload-image error: No file uploaded");
      return new Response("No file uploaded", { status: 400 });
    }

    const fileName = `${Date.now()}-${fileUpload.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cat-images")
      .upload(fileName, fileUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase
      .from("CatImages")
      .insert([
        {
          key: fileName,
          storage_path: uploadData.path,
          caption, // ← save caption in the DB
        },
      ]);

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return new Response("Failed to save metadata", { status: 500 });
    }

    return Response.json({ success: true, path: uploadData.path }, { status: 200 });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
