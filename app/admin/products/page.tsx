import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
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
    <ProductsClient
      initialProducts={products ?? []}
      categories={categories ?? []}
    />
  );
}
