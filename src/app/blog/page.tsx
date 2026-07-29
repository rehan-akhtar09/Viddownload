'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, getDocsFromCache } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Calendar, Clock, FileText } from 'lucide-react';
import { use } from 'react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string | null;
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
  author?: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'blogs'), where('published', '==', true), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost)));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const formatDate = (ts?: { toMillis?: () => number; toDate?: () => Date }) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts.toMillis ? ts.toMillis() : 0);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Blog</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Tips, guides, and updates</p>
          </div>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-16 text-neutral-500 dark:text-neutral-500">
            <p className="font-medium">No blog posts yet</p>
            <p className="text-sm mt-1">Check back soon for new content.</p>
          </div>
        )}

        <div className="grid gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={'/blog/' + post.slug}
              className="block p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 hover:border-red-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                {post.categoryName && (
                  <span className="px-2 py-0.5 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-medium">
                    {post.categoryName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
