"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Category { id: string; name: string; slug: string; created_at: string }

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name,       setName]       = useState("");
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editName,   setEditName]   = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to create category"); return; }
      setCategories(prev => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      toast.success(`Category "${json.name}" created`);
    } catch {
      toast.error("Network error — please try again");
    } finally { setSaving(false); }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      const res  = await fetch(`/api/categories/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: editName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to update category"); return; }
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...json } : c));
      toast.success("Category updated");
    } catch {
      toast.error("Network error — please try again");
    } finally { setEditId(null); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All its products will also be deleted.`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Failed to delete"); return; }
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error("Network error — please try again");
    }
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-soft mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Category</h2>
        <form onSubmit={create} className="flex gap-3">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Category name (e.g. Stickers)"
            className="max-w-sm"
          />
          <Button disabled={saving || !name.trim()} type="submit">
            {saving ? "Adding…" : "Add Category"}
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-soft overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No categories yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Slug</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Created</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    {editId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(cat.id); if (e.key === "Escape") setEditId(null); }}
                          autoFocus
                          className="h-8 text-sm max-w-[200px]"
                        />
                        <Button size="sm" onClick={() => saveEdit(cat.id)} className="h-8 text-xs">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)} className="h-8 text-xs">Cancel</Button>
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-5 py-3.5">
                    <Badge variant="secondary" className="font-mono text-xs">/{cat.slug}</Badge>
                  </td>

                  {/* Created */}
                  <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell">
                    {new Date(cat.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/${cat.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium"
                      >
                        View
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M7 2h3v3M10 2L5.5 6.5M4 3H2v7h7v-2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                      <button
                        onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M11 2l3 3-8 8H3v-3L11 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => del(cat.id, cat.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="2,4 4,4 14,4" strokeLinecap="round" />
                          <path d="M13 4l-1 9H4L3 4" />
                          <path d="M6.5 7v4M9.5 7v4" strokeLinecap="round" />
                          <path d="M6 4V2h4v2" strokeLinecap="round" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
