import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category_id');
  const slug       = searchParams.get('slug');

  if (slug) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();

    if (error || !data) return Response.json({ error: 'Product not found' }, { status: 404 });
    return Response.json(data);
  }

  let query = supabaseAdmin
    .from('products')
    .select('*, categories(name, slug)')
    .order('name');

  if (categoryId) query = query.eq('category_id', categoryId);

  const { data } = await query;
  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    category_id: string;
    name: string;
    description?: string;
    price: number;
    min_qty?: number;
    sizes?: string[];
    media?: { url: string; type: string }[];
  };

  const { category_id, name, description, price, min_qty = 1, sizes = [], media = [] } = body;

  if (!category_id || !name?.trim() || price == null)
    return Response.json({ error: 'category_id, name, and price are required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      category_id,
      name: name.trim(),
      slug: slugify(name),
      description: description?.trim() || null,
      price: Number(price),
      min_qty: Number(min_qty) || 1,
      sizes,
      media,
    })
    .select('*, categories(name, slug)')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
