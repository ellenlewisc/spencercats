import { getStore } from "@netlify/blobs";

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
    return { statusCode: 200, body: "Deleted successfully" };
  } catch (err) {
    console.error("Delete failed:", err);
    return { statusCode: 500, body: "Failed to delete: " + err.message };
  }
}
