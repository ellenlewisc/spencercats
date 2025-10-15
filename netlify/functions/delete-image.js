import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export async function handler(event) {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const key = event?.queryStringParameters?.key;
  if (!key) {
    return { statusCode: 400, body: "Missing `key` parameter" };
  }

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  const catStore = getStore({
    name: "Cats",
    consistency: "strong",
    ...(siteID && { siteID }),
    ...(token && { token }),
  });

  try {
    await catStore.delete(key);
    await supabase.from("cats").delete().eq("key", key);
    return { statusCode: 200, body: "Deleted successfully" };
  } catch (err) {
    console.error("Delete failed:", err);
    return { statusCode: 500, body: "Failed to delete: " + err.message };
  }
}
