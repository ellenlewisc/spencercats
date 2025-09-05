import { getStore } from "@netlify/blobs";

export async function handler() {
  // The key of your blob
  const key = "1757081008265-petcat1.jpeg";

  try {
    const catStore = getStore({ name: "Cats", consistency: "strong" });
    const blob = await catStore.get(key, { type: "stream" });

    if (!blob) {
      return { statusCode: 404, body: "Image not found" };
    }

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg", // change if your image is a PNG or other
      },
    });
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
}
