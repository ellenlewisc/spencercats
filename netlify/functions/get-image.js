import { getStore } from "@netlify/blobs";

export async function handler(event) {
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

  // Detect dev mode
  const isDev = process.env.NETLIFY_DEV === "true";

  const blob = await catStore.get(key, { type: "stream" });

  if (!blob) {
    return { statusCode: 404, body: "Image not found" };
  }

  if (isDev) {
    // Convert stream to buffer and then base64 for dev
    const chunks = [];
    for await (const chunk of blob) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: { "Content-Type": "image/jpeg" },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } else {
    // Prod: stream directly
    return {
      statusCode: 200,
      headers: { "Content-Type": "image/jpeg" },
      body: blob, // Node stream
    };
  }
}
