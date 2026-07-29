'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/auth-context';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoriesPage() {
  const { token } = useAdminAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCats(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName('');
    setAdding(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await fetch('/api/admin/categories/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });
    await load();
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      <form onSubmit={add} className="flex gap-2">
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
          placeholder="New category name"
        />
        <button type="submit" disabled={adding || !name.trim()}
          className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">/{c.slug}</p>
            </div>
            <button onClick={() => remove(c.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {cats.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No categories yet</p>}
      </div>
    </div>
  );
}
