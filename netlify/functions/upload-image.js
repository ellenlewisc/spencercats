import { getStore } from "@netlify/blobs";

export default async function handler(req) {
  try {

    const formData = await req.formData();

    const fileUpload = formData.get("fileUpload"); 

    if (!fileUpload) {
      return new Response("No file uploaded", { status: 400 });
    }

    const catStore = getStore({ name: "Cats", consistency: "strong" });

    // Generate a unique key for the file
    const key = `${Date.now()}-${fileUpload.name}`;

    // Save the file to the store
    await catStore.set(key, fileUpload);

    return new Response(JSON.stringify({ key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-image error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
