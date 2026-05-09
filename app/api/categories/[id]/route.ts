import { supabaseAdmin } from '@/lib/supabase/client';
import { getSession } from '@/lib/session';

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin')
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
