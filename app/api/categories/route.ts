import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function GET() {
  const { data } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, created_at, products(id, name, slug)')
    .order('name');
  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim())
    return Response.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name: name.trim(), slug: slugify(name) })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
