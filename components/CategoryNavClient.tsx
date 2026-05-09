'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Product  { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string; products: Product[] }

export default function CategoryNavClient({ categories }: { categories: Category[] }) {
  const [openId,   setOpenId]   = useState<string | null>(null);
  const [dropLeft, setDropLeft] = useState(0);
  const navRef  = useRef<HTMLElement>(null);
  const pathname = usePathname();

  if (!categories.length) return null;

  const activeCat = categories.find(c => c.id === openId);

  function enter(catId: string, el: HTMLElement) {
    if (!navRef.current) return;
    const btnRect = el.getBoundingClientRect();
    const navRect = navRef.current.getBoundingClientRect();
    setDropLeft(btnRect.left - navRect.left);
    setOpenId(catId);
  }

  return (
    /* onMouseLeave fires only when the pointer truly leaves the <nav> bounds,
       so moving from the row into the dropdown keeps it open. */
    <nav
      ref={navRef}
      className="relative border-b border-gray-100 bg-white"
      onMouseLeave={() => setOpenId(null)}
    >
      {/* ── scrollable category row ── */}
      <div className="max-w-5xl mx-auto px-6 h-10 flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {categories.map(cat => {
          const isActive    = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`);
          const hasProducts = cat.products.length > 0;
          return (
            <div
              key={cat.id}
              className="shrink-0"
              onMouseEnter={e => enter(cat.id, e.currentTarget)}
            >
              <div className={`flex items-center rounded-md transition-colors ${
                isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}>
                <Link
                  href={`/${cat.slug}`}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive ? 'text-black' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {cat.name}
                </Link>
                {hasProducts && (
                  <span className="pr-2 text-gray-400">
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-150 ${openId === cat.id ? 'rotate-180' : ''}`}
                    />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dropdown — rendered OUTSIDE the overflow container so it isn't clipped ── */}
      {openId && activeCat && activeCat.products.length > 0 && (
        <div
          className="absolute top-full pt-1 z-50"
          style={{ left: dropLeft }}
          /* keep open while hovering the dropdown itself */
          onMouseEnter={() => setOpenId(openId)}
        >
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[180px]">
            {activeCat.products.map(p => (
              <Link
                key={p.id}
                href={`/${activeCat.slug}/${p.slug}`}
                onClick={() => setOpenId(null)}
                className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
