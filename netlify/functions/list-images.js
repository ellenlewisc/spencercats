import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const handler = async () => {
  const { data, error } = await supabase
    .from("cats")
    .select("key")
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error(error);
    return { statusCode: 500, body: "Failed to list images" };
  }

  const keys = data.map((row) => row.key);
  return { statusCode: 200, body: JSON.stringify(keys) };
};