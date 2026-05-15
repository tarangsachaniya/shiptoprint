'use client';

import { useRef, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface MediaItem { url: string; type: 'image' | 'video' }
interface Category  { id: string; name: string; slug: string }
interface Product {
  id: string; category_id: string; name: string; slug: string;
  description: string | null; price: number; min_qty: number;
  sizes: string[]; media: MediaItem[];
  categories?: { name: string; slug: string };
}

const EMPTY = {
  category_id: '', name: '', description: '',
  price: '', min_qty: '1', sizes: [] as string[], media: [] as MediaItem[],
};

export default function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories:      Category[];
}) {
  const [products,  setProducts]  = useState(initialProducts);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const dropRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id ?? '' });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      category_id: p.category_id, name: p.name,
      description: p.description ?? '', price: String(p.price),
      min_qty: String(p.min_qty), sizes: [...p.sizes], media: [...p.media],
    });
    setShowForm(true);
  }

  function addSize() {
    const v = sizeInput.trim();
    if (!v || form.sizes.includes(v)) return;
    setForm(f => ({ ...f, sizes: [...f.sizes, v] }));
    setSizeInput('');
  }

  async function uploadMedia(file: File, type: 'image' | 'video') {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) return;
      const { url } = await res.json() as { url: string };
      setForm(f => ({ ...f, media: [...f.media, { url, type }] }));
    } finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id || !form.name.trim() || !form.price) {
      toast.error('Category, name, and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        category_id: form.category_id, name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price), min_qty: parseInt(form.min_qty) || 1,
        sizes: form.sizes, media: form.media,
      };
      const res = editId
        ? await fetch(`/api/products/${editId}`, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/products',            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed to save product'); return; }
      setProducts(prev =>
        editId ? prev.map(p => p.id === editId ? json : p) : [...prev, json]
      );
      setShowForm(false);
      toast.success(editId ? `"${json.name}" updated` : `"${json.name}" created`);
    } catch {
      toast.error('Network error — please try again');
    } finally { setSaving(false); }
  }

  async function del(id: string) {
    const product = products.find(p => p.id === id);
    if (!confirm(`Delete "${product?.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? 'Failed to delete'); return; }
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(`"${product?.name}" deleted`);
    } catch {
      toast.error('Network error — please try again');
    }
  }

  /* ── render ── */
  return (
    <div className="p-4 sm:p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5">
          <Plus size={15} /> Add Product
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-4">No products yet.</p>
            <Button onClick={openCreate} variant="outline" size="sm">Add first product</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10" />
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Price</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Min Qty</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Sizes</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const thumb = p.media[0];
                const cat   = categories.find(c => c.id === p.category_id);
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-5 py-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {thumb ? (
                          thumb.type === 'video'
                            ? <video src={thumb.url} className="w-full h-full object-cover" muted />
                            : <img  src={thumb.url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-300" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
                              <rect x="2" y="2" width="12" height="12" rx="1.5" />
                              <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
                              <path d="M2 10l3.5-3.5L8 9l2.5-2.5L14 10" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name + slug */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">/{p.slug}</p>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3 hidden md:table-cell">
                      {cat ? (
                        <Badge variant="secondary" className="text-xs">{cat.name}</Badge>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="font-semibold text-gray-900">₹{Number(p.price).toFixed(2)}</span>
                    </td>

                    {/* Min Qty */}
                    <td className="px-5 py-3 hidden lg:table-cell text-gray-600">{p.min_qty}</td>

                    {/* Sizes */}
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {p.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.sizes.slice(0, 3).map(s => (
                            <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
                          ))}
                          {p.sizes.length > 3 && (
                            <Badge variant="muted" className="text-xs">+{p.sizes.length - 3}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => del(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* ── Slide-over form (unchanged logic) ── */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/25 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white z-50 shadow-2xl overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                {editId ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-6 space-y-5">

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Category *</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Name *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Optional description…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors resize-none"
                />
              </div>

              {/* Price + Min Qty */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Price (₹) *</label>
                  <Input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Min Quantity</label>
                  <Input type="number" min="1" step="1" value={form.min_qty}
                    onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))} />
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Sizes</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.sizes.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-gray-100 text-xs rounded-md px-2 py-1">
                      {s}
                      <button type="button" onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter(x => x !== s) }))}
                        className="text-gray-400 hover:text-gray-700">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                    placeholder='e.g. "2×2 inches"' />
                  <Button type="button" variant="outline" size="icon" onClick={addSize}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Media</label>
                {form.media.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {form.media.map((m, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        {m.type === 'video'
                          ? <video src={m.url} className="w-full h-full object-cover" muted />
                          : <img   src={m.url} className="w-full h-full object-cover" alt="" />}
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, media: f.media.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white rounded px-1 py-0.5">{m.type}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  onClick={() => !uploading && dropRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={async e => {
                    e.preventDefault(); setDragging(false);
                    for (const f of Array.from(e.dataTransfer.files))
                      await uploadMedia(f, f.type.startsWith('video/') ? 'video' : 'image');
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-colors select-none ${
                    dragging   ? 'border-gray-400 bg-gray-50'
                    : uploading ? 'border-gray-200 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
                >
                  {uploading
                    ? <Loader2 size={20} className="animate-spin text-gray-400" />
                    : <Upload  size={20} className="text-gray-400" />}
                  <p className="text-xs text-gray-500 font-medium">
                    {uploading ? 'Uploading…' : 'Drop files or click to browse'}
                  </p>
                  <p className="text-[10px] text-gray-400">PNG · JPG · GIF · WebP · MP4 · MOV</p>
                </div>
                <input ref={dropRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={async e => {
                    for (const f of Array.from(e.target.files ?? []))
                      await uploadMedia(f, f.type.startsWith('video/') ? 'video' : 'image');
                    e.target.value = '';
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
