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
    console.log("List result:", listResult);

    const keys = listResult?.blobs?.map((b) => b.key) || [];

    if (keys.length === 0) {
      return { statusCode: 404, body: "No images found" };
    }

    const jsonString = JSON.stringify(keys);
    const isLambda = !!process.env.NETLIFY_DEV;

    if (isLambda) {
      // Local dev: return base64 JSON
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(jsonString).toString("base64"),
        isBase64Encoded: true,
      };
    } else {
      // Production: return stream JSON
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(jsonString));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Error listing images:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to list images" }) };
  }
}
