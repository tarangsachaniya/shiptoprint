'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setCategories(prev =>
        [...prev, json].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName('');
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this category? All its products will also be deleted.')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 mb-8 text-xs">
        <Link href="/admin" className="flex items-center gap-1 text-gray-400 hover:text-gray-700">
          <ArrowLeft size={13} /> Admin
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-medium text-gray-700">Categories</span>
      </div>

      <h1 className="text-xl font-semibold mb-6">Categories</h1>

      {/* Create form */}
      <form onSubmit={create} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New category name (e.g. Stickers)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <button
          disabled={saving || !name.trim()}
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? '…' : 'Create'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 py-12 text-center">
            No categories yet. Create one above.
          </p>
        )}
        {categories.map(cat => (
          <div
            key={cat.id}
            className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{cat.name}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${cat.slug}`}
                className="text-xs text-gray-400 hover:text-gray-700"
                target="_blank"
              >
                View ↗
              </Link>
              <button
                onClick={() => del(cat.id)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
