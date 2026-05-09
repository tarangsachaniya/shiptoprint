import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import ProductsClient from '@/components/admin/ProductsClient';

export default async function ProductsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/');

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('*, categories(name, slug)')
      .order('name'),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug')
      .order('name'),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={{ email: session.email, role: session.role }} />
      <ProductsClient
        initialProducts={products ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
