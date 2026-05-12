import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import CategoriesClient from '@/components/admin/CategoriesClient';

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/');

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name');

  return (
    <CategoriesClient initialCategories={categories ?? []} />
  );
}
