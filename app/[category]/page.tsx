import { notFound } from 'next/navigation';
import NavWrapper from '@/components/NavWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import Link from 'next/link';

interface MediaItem { url: string; type: 'image' | 'video' }
interface Product {
  id: string; name: string; slug: string;
  price: number; media: MediaItem[];
}
interface Category {
  id: string; name: string; slug: string;
  products: Product[];
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;

  const res = await fetch(`${BASE}/api/categories?slug=${categorySlug}`, {
    cache: 'no-store',
  });

  if (!res.ok) notFound();

  const category: Category | null = await res.json();
  if (!category) notFound();

  const products = (category.products ?? []) as Product[];

  return (
    <div className="min-h-screen bg-white">
      <NavWrapper />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{category.name}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-sm text-gray-400">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {products.map(product => {
              const thumb = product.media?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/${category.slug}/${product.slug}`}
                  className="group border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {thumb ? (
                      thumb.type === 'video' ? (
                        <video
                          src={thumb.url}
                          muted loop playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={thumb.url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:underline underline-offset-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">from ₹{Number(product.price).toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <FooterWrapper />
    </div>
  );
}
