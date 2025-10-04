import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const params = event.queryStringParameters || {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = Math.max(1, parseInt(params.limit ?? "10", 10));

  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) {
    console.error("Missing Netlify Blobs credentials. Ensure NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN are set.");
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Blobs not configured. Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN." }),
    };
  }

  // Always prod: explicit credentials
  const store = getStore({
    name: "Cats", 
    consistency: "strong",
    siteID,
    token,
  });

  const startIndex = (page - 1) * limit;
  let index = 0;
  const keys = [];

  // Grab limit+1 items to detect hasMore
  for await (const entry of store.list({ paginate: true })) {
    for (const blob of entry.blobs) {
      if (index >= startIndex && keys.length < limit + 1) {
        keys.push(blob.key);
      }
      index++;
      if (keys.length >= limit + 1) break;
    }
    if (keys.length >= limit + 1) break;
  }

  const hasMore = keys.length > limit;
  if (hasMore) keys.splice(limit);

  console.log(keys)
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page,
      limit,
      keys,
      hasMore,
    }),
  };
}
