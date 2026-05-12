import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/client";
import Navbar from "./Navbar";

export default async function NavWrapper() {
  const [session, { data: categories }] = await Promise.all([
    getSession(),
    supabaseAdmin
      .from("categories")
      .select("id, name, slug, products(id, name, slug)")
      .order("name"),
  ]);

  const user = session ? { email: session.email, role: session.role } : null;

  return (
    <Navbar
      user={user}
      categories={
        (categories ?? []) as {
          id: string;
          name: string;
          slug: string;
          products: { id: string; name: string; slug: string }[];
        }[]
      }
    />
  );
}
