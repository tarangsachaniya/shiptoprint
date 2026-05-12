"use client";

import { useState } from "react";
import AuthModal from "./AuthModal";
import { Button } from "@/components/ui/button";

export default function DesignAuthGuard() {
  const [showModal,  setShowModal]  = useState(true);
  const [dismissed,  setDismissed]  = useState(false);

  function handleClose() {
    setShowModal(false);
    setDismissed(true);
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 bg-white">
      <div className="text-center max-w-sm">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6 shadow-soft">
          <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Authentication required
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Sign in or create a free account to access the Design Studio and start customising your prints.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => { setShowModal(true); setDismissed(false); }}
            className="px-8"
          >
            Sign in to continue
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()} className="px-8">
            Go back
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Free to sign up · No credit card required
        </p>
      </div>

      {showModal && !dismissed && (
        <AuthModal onClose={handleClose} />
      )}
    </div>
  );
}
