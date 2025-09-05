import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const catStore = getStore({ name: "Cats", consistency: "strong" });

    // List all keys
    const keysResult = await catStore.list();
    const keys = keysResult.keys || [];

    // Convert each key to a public URL
    const images = keys.map((key) => catStore.getURL(key));

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
