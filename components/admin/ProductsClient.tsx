'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';

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
  categories: Category[];
}) {
  const [products,    setProducts]    = useState(initialProducts);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [sizeInput,   setSizeInput]   = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [dragging,    setDragging]    = useState(false);
  const dropRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY, category_id: categories[0]?.id ?? '' });
    setError('');
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditId(p.id);
    setForm({
      category_id: p.category_id, name: p.name,
      description: p.description ?? '', price: String(p.price),
      min_qty: String(p.min_qty), sizes: [...p.sizes], media: [...p.media],
    });
    setError('');
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
      const { url } = (await res.json()) as { url: string };
      setForm(f => ({ ...f, media: [...f.media, { url, type }] }));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id || !form.name.trim() || !form.price) {
      setError('Category, name, and price are required');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        category_id:  form.category_id,
        name:         form.name.trim(),
        description:  form.description.trim() || null,
        price:        parseFloat(form.price),
        min_qty:      parseInt(form.min_qty) || 1,
        sizes:        form.sizes,
        media:        form.media,
      };
      const res = editId
        ? await fetch(`/api/products/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setProducts(prev =>
        editId
          ? prev.map(p => (p.id === editId ? json : p))
          : [...prev, json],
      );
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  /* group products by category */
  const groups = categories
    .map(cat => ({ ...cat, items: products.filter(p => p.category_id === cat.id) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/admin" className="flex items-center gap-1 text-gray-400 hover:text-gray-700">
            <ArrowLeft size={13} /> Admin
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700">Products</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* product list */}
      {products.length === 0 && (
        <p className="text-sm text-gray-400 py-16 text-center">
          No products yet — click &quot;Add Product&quot; to get started.
        </p>
      )}

      {groups.map(group => (
        <div key={group.id} className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            {group.name}
          </h2>
          <div className="space-y-2">
            {group.items.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {p.media[0] && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {p.media[0].type === 'video'
                        ? <video src={p.media[0].url} className="w-full h-full object-cover" muted />
                        : <img src={p.media[0].url} className="w-full h-full object-cover" alt="" />}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ${p.price} &nbsp;·&nbsp; min {p.min_qty} &nbsp;·&nbsp; {p.sizes.length} sizes &nbsp;·&nbsp; {p.media.length} media
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => del(p.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── slide-over form ── */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-1/2 bg-white z-50 shadow-2xl overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editId ? 'Edit Product' : 'New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-6 space-y-5">

              {/* category */}
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1.5">Category *</span>
                <select
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              {/* name */}
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1.5">Name *</span>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </label>

              {/* description */}
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1.5">Description</span>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Optional description…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                />
              </label>

              {/* price + min qty */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 mb-1.5">Price ($) *</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 mb-1.5">Min Quantity</span>
                  <input
                    type="number" min="1" step="1"
                    value={form.min_qty}
                    onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                </label>
              </div>

              {/* sizes */}
              <div>
                <span className="block text-xs font-medium text-gray-600 mb-1.5">Sizes</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.sizes.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-gray-100 text-xs rounded-md px-2 py-1">
                      {s}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, sizes: f.sizes.filter(x => x !== s) }))}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={sizeInput}
                    onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                    placeholder='e.g. "2×2 inches"'
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  />
                  <button
                    type="button" onClick={addSize}
                    className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs hover:border-gray-400"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* media */}
              <div>
                <span className="block text-xs font-medium text-gray-600 mb-1.5">Media</span>
                {form.media.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {form.media.map((m, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        {m.type === 'video'
                          ? <video src={m.url} className="w-full h-full object-cover" muted />
                          : <img src={m.url} className="w-full h-full object-cover" alt="" />}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, media: f.media.filter((_, j) => j !== i) }))}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white rounded px-1 py-0.5">
                          {m.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {/* drag-drop zone */}
                <div
                  onClick={() => !uploading && dropRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={async e => {
                    e.preventDefault(); setDragging(false);
                    const files = Array.from(e.dataTransfer.files);
                    for (const f of files) {
                      await uploadMedia(f, f.type.startsWith('video/') ? 'video' : 'image');
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-colors select-none ${
                    dragging
                      ? 'border-gray-400 bg-gray-50'
                      : uploading
                      ? 'border-gray-200 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {uploading
                    ? <Loader2 size={20} className="animate-spin text-gray-400" />
                    : <Upload size={20} className="text-gray-400" />}
                  <p className="text-xs text-gray-500 font-medium">
                    {uploading ? 'Uploading…' : 'Drop files here or click to browse'}
                  </p>
                  <p className="text-[10px] text-gray-400">PNG · JPG · GIF · WebP · MP4 · MOV</p>
                </div>
                <input
                  ref={dropRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={async e => {
                    const files = Array.from(e.target.files ?? []);
                    for (const f of files) {
                      await uploadMedia(f, f.type.startsWith('video/') ? 'video' : 'image');
                    }
                    e.target.value = '';
                  }}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit" disabled={saving}
                  className="flex-1 bg-black text-white text-sm py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Product'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-200 text-gray-700 text-sm px-4 py-2.5 rounded-lg hover:border-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
