import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CategoryNav from '@/components/CategoryNav';
import ProductCarousel from '@/components/ProductCarousel';
import Link from 'next/link';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categorySlug, product: productSlug } = await params;

  const [session, { data: category }, { data: product }] = await Promise.all([
    getSession(),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .eq('slug', categorySlug)
      .single(),
    supabaseAdmin
      .from('products')
      .select('*')
      .eq('slug', productSlug)
      .single(),
  ]);

  if (!category || !product || product.category_id !== category.id) notFound();

  const user = session ? { email: session.email, role: session.role } : null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <CategoryNav />

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14">
        {/* breadcrumb */}
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

          {/* carousel */}
          <ProductCarousel media={product.media ?? []} />

          {/* details */}
          <div className="space-y-6 md:pt-2">
            <div>
              <Link
                href={`/${category.slug}`}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                {category.name}
              </Link>
              <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
              {product.description && (
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* pricing */}
            <div className="flex items-baseline gap-2 py-3 border-t border-b border-gray-100">
              <span className="text-3xl font-semibold">${product.price}</span>
              <span className="text-sm text-gray-400">/ unit</span>
            </div>

            {/* min qty */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 text-xs uppercase tracking-wide">Minimum order</span>
              <span className="font-medium">{product.min_qty} units</span>
            </div>

            {/* sizes */}
            {product.sizes?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Available sizes</p>
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
                className="flex items-center justify-center gap-2 w-full bg-black text-white text-sm py-3.5 rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Start Designing →
              </Link>
              <p className="text-[11px] text-gray-400 text-center">
                Custom design · Professional print · Fast shipping
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
