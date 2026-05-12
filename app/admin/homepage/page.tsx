import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/client";
import HomepageEditor from "@/components/admin/HomepageEditor";

export default async function HomepagePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const [{ data: hc }, { data: products }] = await Promise.all([
    supabaseAdmin.from("homepage_content").select("*").eq("id", 1).single(),
    supabaseAdmin
      .from("products")
      .select("id, name, price, media")
      .order("name"),
  ]);

  return (
    <HomepageEditor
      initialContent={hc ?? null}
      products={products ?? []}
    />
  );
}
