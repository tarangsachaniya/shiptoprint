import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    category_id?: string;
    name?: string;
    description?: string | null;
    price?: number;
    min_qty?: number;
    sizes?: string[];
    media?: { url: string; type: string }[];
  };

  const patch: Record<string, unknown> = {};
  if (body.category_id  != null) patch.category_id  = body.category_id;
  if (body.name         != null) { patch.name = body.name; patch.slug = slugify(body.name); }
  if (body.description  != null) patch.description = body.description;
  if (body.price        != null) patch.price    = Number(body.price);
  if (body.min_qty      != null) patch.min_qty  = Number(body.min_qty) || 1;
  if (body.sizes        != null) patch.sizes    = body.sizes;
  if (body.media        != null) patch.media    = body.media;

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*, categories(name, slug)')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
