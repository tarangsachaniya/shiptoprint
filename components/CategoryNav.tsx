import { supabaseAdmin } from '@/lib/supabase/client';
import CategoryNavClient from './CategoryNavClient';

export default async function CategoryNav() {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, products(id, name, slug)')
    .order('name');

  return (
    <CategoryNavClient
      categories={
        (data ?? []) as {
          id: string; name: string; slug: string;
          products: { id: string; name: string; slug: string }[];
        }[]
      }
    />
  );
}
