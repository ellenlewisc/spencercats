import { getUserFromRequest, isAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  return Response.json({ isAdmin: user ? isAdmin(user) : false }, { headers: { "Cache-Control": "no-store" } });
}
