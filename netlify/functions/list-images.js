import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const catStore = getStore({ name: "Cats", consistency: "strong" });

    const listResult = await catStore.list();
    console.log("Raw list result:", listResult);

    // Use 'blobs' array if available (sandbox)
    const keys = listResult.keys || listResult.blobs?.map(b => b.key) || [];
    console.log("Keys array:", keys);

    // In production, getURL exists
    const images = keys.map((key) =>
      typeof catStore.getURL === "function" ? catStore.getURL(key) : `/api/blob/${key}`
    );

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
