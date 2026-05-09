'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Product  { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string; products: Product[] }

export default function CategoryNavClient({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();

  if (!categories.length) return null;

  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 h-10 flex items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {categories.map(cat => {
          const isActive = pathname === `/${cat.slug}` || pathname.startsWith(`/${cat.slug}/`);
          const hasProducts = cat.products.length > 0;
          return (
            <div
              key={cat.id}
              className="relative shrink-0"
              onMouseEnter={() => setOpen(cat.id)}
              onMouseLeave={() => setOpen(null)}
            >
              <div className={`flex items-center rounded-md transition-colors ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                <Link
                  href={`/${cat.slug}`}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? 'text-black' : 'text-gray-600 hover:text-black'}`}
                >
                  {cat.name}
                </Link>
                {hasProducts && (
                  <button
                    onClick={() => setOpen(open === cat.id ? null : cat.id)}
                    className={`pr-2 text-gray-400 hover:text-gray-700 transition-colors ${isActive ? 'text-gray-600' : ''}`}
                  >
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-150 ${open === cat.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>

              {open === cat.id && hasProducts && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} />
                  <div className="absolute left-0 top-full pt-1 z-20 min-w-[180px]">
                    <div className="bg-white border border-gray-200 rounded-xl shadow-xl py-1.5">
                      {cat.products.map(p => (
                        <Link
                          key={p.id}
                          href={`/${cat.slug}/${p.slug}`}
                          onClick={() => setOpen(null)}
                          className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                        >
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
