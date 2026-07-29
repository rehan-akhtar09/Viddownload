'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  slug: string;
  categoryName?: string;
  createdAt?: { _seconds?: number };
}

export default function BlogsPage() {
  const { token } = useAdminAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const load = async () => {
    const res = await fetch('/api/admin/blogs');
    const data = await res.json();
    setBlogs(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm('Delete this blog post?')) return;
    await fetch('/api/admin/blogs/' + id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Blogs</h1>
        <Link href="/admin/blogs/new" className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Blog
        </Link>
      </div>

      <div className="space-y-2">
        {blogs.map((b) => (
          <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-white/10">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{b.title || 'Untitled'}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                /blog/{b.slug}
                {b.categoryName && <span className="ml-2 px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">{b.categoryName}</span>}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <Link href={'/blog/' + b.slug} target="_blank" className="p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-all">
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link href={'/admin/blogs/' + b.id + '/edit'} className="p-2 rounded-lg text-neutral-500 hover:text-blue-400 hover:bg-blue-600/10 transition-all">
                <Edit className="h-4 w-4" />
              </Link>
              <button onClick={() => remove(b.id)} className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-600/10 transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {blogs.length === 0 && <p className="text-sm text-neutral-500 text-center py-12">No blog posts yet</p>}
      </div>
    </div>
  );
}
