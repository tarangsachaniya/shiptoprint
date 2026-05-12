"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthModal from "./AuthModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product  { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string; products: Product[] }

interface NavbarProps {
  user:        { email: string; role: string } | null;
  categories?: Category[];
}

/* Alternating left-panel row backgrounds (when not active) */
const LEFT_BG = ["bg-white", "bg-gray-50/80", "bg-zinc-50/60", "bg-slate-50/60"];

export default function Navbar({ user, categories = [] }: NavbarProps) {
  const router      = useRouter();
  const [showModal,        setShowModal]        = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [megaOpen,         setMegaOpen]         = useState(false);
  const [mobileProdsOpen,  setMobileProdsOpen]  = useState(false);
  const [activeCatId,      setActiveCatId]      = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasCategories = categories.length > 0;
  const activeCat     = categories.find(c => c.id === activeCatId) ?? categories[0] ?? null;

  function scheduleClose() {
    closeTimer.current = setTimeout(() => { setMegaOpen(false); }, 150);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function openMega() {
    cancelClose();
    if (!activeCatId && categories[0]) setActiveCatId(categories[0].id);
    setMegaOpen(true);
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100"
        /* Close mega-menu when mouse leaves entire header */
        onMouseLeave={() => { cancelClose(); scheduleClose(); }}
      >
        {/* ── Main bar ── */}
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="font-bold text-gray-900 text-base tracking-tight hover:opacity-75 transition-opacity flex-shrink-0">
            ShipToPrint
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* Products mega-menu trigger */}
            <div
              onMouseEnter={openMega}
              className="relative"
            >
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  megaOpen
                    ? "text-gray-900 bg-gray-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                aria-expanded={megaOpen}
              >
                Products
                <svg
                  className={cn("w-3.5 h-3.5 text-gray-400 transition-transform duration-200", megaOpen && "rotate-180")}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <Link href="/design" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
              Design Studio
            </Link>
            <Link href="#reviews" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150">
              Reviews
            </Link>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-xs text-gray-400 max-w-[140px] truncate">{user.email}</span>
                {user.role === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-xs hidden sm:flex">Dashboard</Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">Log out</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setShowModal(true)} className="text-xs shadow-soft">Log in</Button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => { setMobileOpen(!mobileOpen); setMobileProdsOpen(false); }}
              aria-label="Toggle menu"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                {mobileOpen
                  ? <path d="M2 2l12 12M14 2L2 14" strokeLinecap="round" />
                  : <><path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" /></>}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Two-panel mega-menu ── */}
        {megaOpen && hasCategories && (
          <div
            className="absolute top-full left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <div className="max-w-6xl mx-auto flex" style={{ minHeight: 200 }}>

              {/* LEFT PANEL — category list */}
              <div className="w-56 flex-shrink-0 border-r border-gray-100 py-2">
                {categories.map((cat, i) => {
                  const isActive = cat.id === (activeCatId ?? categories[0]?.id);
                  return (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setActiveCatId(cat.id)}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-all duration-100",
                        isActive
                          ? "bg-gray-900 text-white"
                          : cn("text-gray-700 hover:bg-gray-100", LEFT_BG[i % LEFT_BG.length])
                      )}
                    >
                      <Link
                        href={`/${cat.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className={cn(
                          "text-sm font-medium flex-1 leading-snug",
                          isActive ? "text-white" : "text-gray-800"
                        )}
                      >
                        {cat.name}
                      </Link>
                      <svg
                        className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-white" : "text-gray-400")}
                        viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                      >
                        <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT PANEL — products grid for active category */}
              <div className="flex-1 p-6">
                {activeCat ? (
                  <>
                    {/* Section heading */}
                    <div className="flex items-center gap-3 mb-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                        {activeCat.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {activeCat.products.length} product{activeCat.products.length !== 1 ? "s" : ""}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                      <Link
                        href={`/${activeCat.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className="text-xs text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1 group/all"
                      >
                        View all
                        <svg className="w-3 h-3 group-hover/all:translate-x-0.5 transition-transform" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </div>

                    {activeCat.products.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-4">No products in this category yet.</p>
                    ) : (
                      /* Products grid — 3 columns, alternating row backgrounds */
                      <div className="grid grid-cols-3 lg:grid-cols-4">
                        {activeCat.products.map((p, idx) => {
                          /* which visual row: every 3 (or 4 on lg) items */
                          const col  = 3; // use 3 as base for row calc
                          const rowI = Math.floor(idx / col);
                          const rowBg = rowI % 2 === 0 ? "bg-white" : "bg-gray-50/60";
                          return (
                            <Link
                              key={p.id}
                              href={`/${activeCat.slug}/${p.slug}`}
                              onClick={() => setMegaOpen(false)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-100 group/item",
                                rowBg
                              )}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/item:bg-gray-700 flex-shrink-0 transition-colors" />
                              <span className="leading-tight">{p.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 py-4">Hover a category to browse products.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white divide-y divide-gray-50">
            {hasCategories && (
              <div>
                <button
                  onClick={() => setMobileProdsOpen(!mobileProdsOpen)}
                  className="w-full flex items-center justify-between px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Products
                  <svg className={cn("w-4 h-4 text-gray-400 transition-transform", mobileProdsOpen && "rotate-180")}
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {mobileProdsOpen && (
                  <div className="pb-2">
                    {categories.map((cat, i) => (
                      <div key={cat.id} className={cn("px-6 py-3", LEFT_BG[i % LEFT_BG.length])}>
                        <Link
                          href={`/${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="block text-xs font-bold uppercase tracking-widest text-gray-900 mb-2"
                        >
                          {cat.name}
                        </Link>
                        <ul className="space-y-1 pl-2">
                          {cat.products.map(p => (
                            <li key={p.id}>
                              <Link
                                href={`/${cat.slug}/${p.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 py-0.5 transition-colors"
                              >
                                <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Link href="/design"  onClick={() => setMobileOpen(false)} className="block px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Design Studio</Link>
            <Link href="#reviews" onClick={() => setMobileOpen(false)} className="block px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Reviews</Link>
          </div>
        )}
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
