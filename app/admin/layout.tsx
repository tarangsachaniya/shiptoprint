import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar userEmail={session.email} />
      <div className="flex-1 ml-0 md:ml-60 min-h-screen overflow-auto pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
