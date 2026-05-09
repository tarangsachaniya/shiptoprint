"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    if (data.role === "admin") {
      router.push("/admin");
    } else {
      onClose();
      router.refresh();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm mx-4 p-8 rounded-lg shadow-sm border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab toggle */}
        <div className="flex border-b border-gray-100 mb-6">
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              mode === "login"
                ? "text-black border-b-2 border-black -mb-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Log in
          </button>
          <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "text-black border-b-2 border-black -mb-px"
                : "text-gray-400 hover:text-gray-600"
            }`}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-black transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-sm py-2.5 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
