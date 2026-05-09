import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CategoryNav from '@/components/CategoryNav';
import Link from 'next/link';

interface MediaItem { url: string; type: 'image' | 'video' }
interface Product {
  id: string; name: string; slug: string;
  price: number; media: MediaItem[];
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const [session, { data: category, error }] = await Promise.all([
    getSession(),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug, products(id, name, slug, price, media)')
      .eq('slug', params.category)
      .single(),
  ]);

  if (error || !category) notFound();

  const user = session ? { email: session.email, role: session.role } : null;
  const products = (category.products ?? []) as Product[];

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <CategoryNav />

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-14">
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-1">Category</p>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>

        {products.length === 0 ? (
          <div className="py-24 text-center text-sm text-gray-400">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => {
              const thumb = product.media?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/${category.slug}/${product.slug}`}
                  className="group border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200"
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
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium leading-tight group-hover:underline underline-offset-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">from ${product.price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
