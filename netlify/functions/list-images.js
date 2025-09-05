import { getStore } from "@netlify/blobs";

export default async function handler() {
  try {
    const catStore = getStore({ name: "Cats", consistency: "strong" });

    const listResult = await catStore.list();
    console.log("Raw list result:", listResult);

    // Get keys from listResult
    const keys = listResult.keys || listResult.blobs?.map(b => b.key) || [];
    console.log("Keys array:", keys);
    const promises = keys.map(async (key) => {
      try {
        const userUploadBlob = await catStore.get(key);
        console.log(`Blob for key ${key}:`, userUploadBlob);
        return userUploadBlob;
      } catch (err) {
        console.error(`Failed to get blob for key ${key}:`, err);
        return null;
      }
    });

    const images = await Promise.all(promises);
    console.log("images", images)

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("list-images error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
