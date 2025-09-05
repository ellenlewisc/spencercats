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
    // Works in both local and prod
    return {
      statusCode: 404,
      body: "Image not found",
    };
  }

  // Detect if running in Lambda compatibility (local dev) or deployed
  const isLambda = !!process.env.NETLIFY_DEV; // true when running `netlify dev`

  if (isLambda) {
    // Convert stream to buffer for local dev (Lambda)
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
  } else {
    // In production (Edge function), just return the Response
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  }
}
