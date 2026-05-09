import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import CategoriesClient from '@/components/admin/CategoriesClient';

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/');

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name');

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={{ email: session.email, role: session.role }} />
      <CategoriesClient initialCategories={categories ?? []} />
    </div>
  );
}
