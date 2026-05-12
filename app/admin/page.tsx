import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/client";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  const { data: users, count } = await supabaseAdmin
    .from("users")
    .select("id, email, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: productCount } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true });

  const { count: categoryCount } = await supabaseAdmin
    .from("categories")
    .select("id", { count: "exact", head: true });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Users", value: count ?? 0 },
          { label: "Products", value: productCount ?? 0 },
          { label: "Categories", value: categoryCount ?? 0 },
          { label: "Admins", value: users?.filter((u) => u.role === "admin").length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-soft">
            <p className="text-xs text-gray-400 mb-1.5">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/admin/products", label: "Manage Products", desc: "Add, edit, or remove products" },
            { href: "/admin/categories", label: "Manage Categories", desc: "Organise your product categories" },
            { href: "/admin/homepage", label: "Edit Homepage", desc: "Update hero, reviews, and footer" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-300 hover:shadow-card transition-all duration-200 group"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:underline">{action.label}</p>
              <p className="text-xs text-gray-500">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Users</h2>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-700">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === "admin"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-gray-400">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
