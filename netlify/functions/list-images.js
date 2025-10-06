import { getStore } from "@netlify/blobs";

export async function handler() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  const catStore = getStore({
    name: "Cats",
    consistency: "strong",
    ...(siteID && { siteID }),
    ...(token && { token }),
  });

  try {
    const listResult = await catStore.list();

     const keys = listResult?.blobs?.map(b => b.key).reverse() || [];
    if (keys.length === 0) {
      return { statusCode: 404, body: "No images found" };
    }

    const jsonString = JSON.stringify(keys);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(jsonString).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Error listing images:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to list images" }) };
  }
}
