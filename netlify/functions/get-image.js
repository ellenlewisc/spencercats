import { getStore } from "@netlify/blobs";

export async function handler(event) {
  // Get the key from the query string
  const key = event?.queryStringParameters?.key;
  if (!key) {
    return { statusCode: 400, body: "Missing `key` parameter" };
  }

  // Use environment variables locally if needed
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  const catStore = getStore({
    name: "Cats",
    consistency: "strong",
    ...(siteID && { siteID }),
    ...(token && { token }),
  });

  const blob = await catStore.get(key, { type: "stream" });

  if (!blob) {
    return {
      statusCode: 404,
      body: "Image not found",
    };
  }

  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of blob) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };

}
