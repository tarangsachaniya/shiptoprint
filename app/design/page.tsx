import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CanvasEditor from "@/components/CanvasEditor";

export default async function DesignPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <CanvasEditor />;
}
