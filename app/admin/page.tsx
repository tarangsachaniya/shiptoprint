
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { data: users, count } = await supabaseAdmin
    .from("users")
    .select("id, email, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(20);

  const adminUser = { email: session.email, role: session.role };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={adminUser} />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Manage users and platform activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-gray-100 rounded-lg p-5">
            <p className="text-xs text-gray-400 mb-1">Total users</p>
            <p className="text-2xl font-semibold">{count ?? 0}</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5">
            <p className="text-xs text-gray-400 mb-1">Admins</p>
            <p className="text-2xl font-semibold">
              {users?.filter((u) => u.role === "admin").length ?? 0}
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5">
            <p className="text-xs text-gray-400 mb-1">Regular users</p>
            <p className="text-2xl font-semibold">
              {users?.filter((u) => u.role === "user").length ?? 0}
            </p>
          </div>
        </div>

        {/* Tools */}
        <div className="mb-10">
          <h2 className="text-sm font-medium mb-3">Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/categories"
              className="border border-gray-100 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <p className="text-sm font-medium group-hover:underline">Categories</p>
              <p className="text-xs text-gray-400 mt-1">Create and manage product categories</p>
            </Link>
            <Link
              href="/admin/products"
              className="border border-gray-100 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <p className="text-sm font-medium group-hover:underline">Products</p>
              <p className="text-xs text-gray-400 mt-1">Add products with images, videos & pricing</p>
            </Link>
          </div>
        </div>

        {/* Users table */}
        <div>
          <h2 className="text-sm font-medium mb-3">Recent users</h2>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            u.role === "admin"
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-400">
                      No users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
