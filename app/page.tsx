import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import CategoryNav from "@/components/CategoryNav";

export default async function HomePage() {
  const session = await getSession();
  const user = session ? { email: session.email, role: session.role } : null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <CategoryNav />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24">
        <div className="max-w-lg">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            ShipToPrint
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Professional printing, delivered. Upload your files and get high-quality
            prints shipped directly to your door.
          </p>

          {user ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Welcome back, <span className="text-black font-medium">{user.email}</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-100 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Orders</p>
                  <p className="text-2xl font-semibold">0</p>
                </div>
                <div className="border border-gray-100 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">In progress</p>
                  <p className="text-2xl font-semibold">0</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/design"
                  className="bg-black text-white text-sm px-5 py-2.5 rounded hover:bg-gray-800 transition-colors text-center"
                >
                  Create sticker
                </a>
                <button className="border border-gray-200 text-gray-700 text-sm px-5 py-2.5 rounded hover:border-gray-400 transition-colors">
                  New order
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Get started for free — no credit card required.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
