'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryName: string | null;
  categoryId: string | null;
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
  author?: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const q = query(collection(db, 'blogs'), where('slug', '==', slug), where('published', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setPost({ id: snap.docs[0].id, ...snap.docs[0].data() } as BlogPost);
        } else {
          setError('Blog post not found');
        }
      } catch {
        setError('Failed to load blog post');
      }
      setLoading(false);
    })();
  }, [slug]);

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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-neutral-500 dark:text-neutral-400">{error || 'Not found'}</p>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <header className="space-y-4 pb-8 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
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
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {post.title}
          </h1>
        </header>

        <div
          className="prose prose-neutral dark:prose-invert prose-sm md:prose-base max-w-none
            prose-headings:text-neutral-900 dark:prose-headings:text-white
            prose-a:text-red-600 dark:prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-neutral-900 dark:prose-strong:text-white
            prose-code:text-red-600 dark:prose-code:text-red-400
            prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10
            prose-img:rounded-2xl prose-img:border prose-img:border-black/10 dark:prose-img:border-white/10
            prose-blockquote:border-red-600 prose-blockquote:text-neutral-600 dark:prose-blockquote:text-neutral-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="pt-8 border-t border-black/10 dark:border-white/10 text-xs text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.author || 'VeloDown Team'}
          </span>
        </div>
      </article>
    </div>
  );
}
