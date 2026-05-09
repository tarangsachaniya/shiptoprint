import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import CanvasEditor from "@/components/CanvasEditor";

export default async function AdminCanvasPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return <CanvasEditor />;
}
