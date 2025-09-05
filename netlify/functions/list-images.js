import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const catStore = getStore({ name: "Cats", consistency: "strong" });

    // List all keys in the store
    const keysResult = await catStore.list();
    const keys = keysResult.keys || [];

    // Convert each key to a blob URL
    const images = await Promise.all(
      keys.map(async (key) => {
        const blob = await catStore.get(key, { type: "blob" });
        if (!blob) return null;
        return URL.createObjectURL(blob);
      })
    );

    const validImages = images.filter(Boolean);

    return new Response(JSON.stringify({ images: validImages }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
