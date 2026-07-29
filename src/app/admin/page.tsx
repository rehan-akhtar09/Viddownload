'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, FolderTree, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const [blogCount, setBlogCount] = useState(0);
  const [catCount, setCatCount] = useState(0);
  const [recentBlogs, setRecentBlogs] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/blogs');
        const blogs = await res.json();
        if (Array.isArray(blogs)) {
          setBlogCount(blogs.length);
          setRecentBlogs(blogs.slice(0, 5));
        }
        const catRes = await fetch('/api/admin/categories');
        const cats = await catRes.json();
        if (Array.isArray(cats)) setCatCount(cats.length);
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-2xl font-black text-white">{blogCount}</span>
          </div>
          <p className="text-sm text-neutral-400">Total Blogs</p>
        </div>
        <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
              <FolderTree className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-2xl font-black text-white">{catCount}</span>
          </div>
          <p className="text-sm text-neutral-400">Categories</p>
        </div>
        <Link href="/admin/blogs/new"
          className="p-5 rounded-2xl bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 transition-colors flex items-center gap-3">
          <Plus className="h-5 w-5 text-red-400" />
          <span className="font-semibold text-sm text-red-400">New Blog Post</span>
        </Link>
      </div>

      {recentBlogs.length > 0 && (
        <div className="p-5 rounded-2xl bg-neutral-900 border border-white/10">
          <h2 className="font-bold text-white mb-3">Recent Blogs</h2>
          <div className="space-y-2">
            {recentBlogs.map((b) => (
              <Link key={b.id} href={'/admin/blogs/' + b.id + '/edit'}
                className="block px-3 py-2 rounded-xl bg-neutral-800 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors">
                {b.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
