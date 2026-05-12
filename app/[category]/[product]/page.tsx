import { notFound } from 'next/navigation';
import NavWrapper from '@/components/NavWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import ProductCarousel from '@/components/ProductCarousel';
import Link from 'next/link';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

interface Category { id: string; name: string; slug: string }
interface Product  {
  id: string; name: string; slug: string; category_id: string;
  description: string | null; price: number; min_qty: number;
  sizes: string[]; media: { url: string; type: 'image' | 'video' }[];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categorySlug, product: productSlug } = await params;

  const [catRes, prodRes] = await Promise.all([
    fetch(`${BASE}/api/categories?slug=${categorySlug}`, { cache: 'no-store' }),
    fetch(`${BASE}/api/products?slug=${productSlug}`,    { cache: 'no-store' }),
  ]);

  if (!catRes.ok || !prodRes.ok) notFound();

  const [category, product]: [Category | null, Product | null] = await Promise.all([
    catRes.json(),
    prodRes.json(),
  ]);

  if (!category || !product || product.category_id !== category.id) notFound();

  return (
    <div className="min-h-screen bg-white">
      <NavWrapper />

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-10">
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/${category.slug}`} className="hover:text-gray-700 transition-colors">
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Carousel */}
          <ProductCarousel media={product.media ?? []} />

          {/* Details */}
          <div className="space-y-6 md:pt-2">
            <div>
              <Link
                href={`/${category.slug}`}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                {category.name}
              </Link>
              <h1 className="text-2xl font-bold tracking-tight mt-1 text-gray-900">{product.name}</h1>
              {product.description && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 py-4 border-t border-b border-gray-100">
              <span className="text-3xl font-bold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
              <span className="text-sm text-gray-400">/ unit</span>
            </div>

            {/* Min qty */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Minimum order</span>
              <span className="font-semibold text-gray-900">{product.min_qty} units</span>
            </div>

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Available sizes</p>
                <div className="flex flex-wrap gap-2">
                  {(product.sizes as string[]).map(s => (
                    <span
                      key={s}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium hover:border-gray-900 hover:text-gray-900 cursor-pointer transition-colors"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <Link
                href="/design"
                className="flex items-center justify-center gap-2 w-full bg-black text-white text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Start Designing
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <p className="text-[11px] text-gray-400 text-center">
                Custom design · Professional print · Fast shipping
              </p>
            </div>
          </div>
        </div>
      </main>
      <FooterWrapper />
    </div>
  );
}
