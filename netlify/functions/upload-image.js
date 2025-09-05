import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  try {
    const formData = await req.formData();
    const fileUpload = formData.get("fileUpload");

    if (!fileUpload) {
      return new Response("No file uploaded", { status: 400 });
    }

    console.log("Incoming file:", fileUpload.name);
    console.log("Size (bytes):", fileUpload.size);
    console.log("Type:", fileUpload.type);

    const catStore = getStore({ name: "Cats", consistency: "strong" });

    // Generate a unique key
    const key = `${Date.now()}-${fileUpload.name}`;

    // Use stream if available for large files
    let fileToStore;
    if (fileUpload.stream) {
      fileToStore = fileUpload.stream(); // Use streaming API
    } else {
      fileToStore = fileUpload; // fallback for smaller files
    }

    await catStore.set(key, fileToStore);
    console.log("Upload successful:", key);

    return new Response(JSON.stringify({ key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
