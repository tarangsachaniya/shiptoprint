"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";

interface NavbarProps {
  user: { email: string; role: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight">ShipToPrint</span>

          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <>
                <span className="hidden sm:block text-xs text-gray-500 max-w-[160px] truncate">{user.email}</span>
                <a href="/design" className="text-xs text-gray-600 hover:text-black transition-colors">
                  Design
                </a>
                {user.role === "admin" && (
                  <a href="/admin" className="text-xs text-gray-600 hover:text-black transition-colors">
                    Dashboard
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-600 hover:text-black transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="text-xs bg-black text-white px-4 py-1.5 rounded hover:bg-gray-800 transition-colors"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
