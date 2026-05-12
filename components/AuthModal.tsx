"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({ onClose, defaultMode = "login" }: AuthModalProps) {
  const router  = useRouter();
  const [mode,     setMode]     = useState<"login" | "signup">(defaultMode);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res  = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Something went wrong"); return; }

    if (data.role === "admin") {
      router.push("/admin");
    } else {
      onClose();
      router.refresh();
    }
  }

  function switchMode(m: "login" | "signup") {
    setMode(m);
    setError("");
    setEmail("");
    setPassword("");
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Brand header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 mb-4">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">ShipToPrint</h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === "login" ? "Welcome back — sign in to your account" : "Create your free account to get started"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          {(["login", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-all duration-150",
                mode === m
                  ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="auth-email">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
                </svg>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
              {loading
                ? "Please wait…"
                : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-5">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="text-gray-700 font-medium hover:underline"
            >
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          aria-label="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
