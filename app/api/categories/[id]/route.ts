import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, created_at, products(id, name, slug, price, media)')
    .eq('id', id)
    .single();

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!await requireAdmin())
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim())
    return Response.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ name: name.trim(), slug: slugify(name) })
    .eq('id', id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!await requireAdmin())
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
