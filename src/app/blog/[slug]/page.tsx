'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryName?: string;
  createdAt?: string;
  author?: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { slug } = await params;
        const res = await fetch(`/api/public/blogs/slug?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setError('Blog post not found');
          return;
        }
        const data = await res.json();
        setPost(data);
      } catch {
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-neutral-500">{error || 'Post not found'}</p>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <article className="space-y-6">
          <div className="space-y-3">
            {post.categoryName && (
              <span className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-medium">
                {post.categoryName}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              {post.createdAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {post.author && (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
              )}
            </div>
          </div>

          {post.excerpt && (
            <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed">{post.excerpt}</p>
          )}

          <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:text-neutral-900 dark:prose-headings:text-white prose-a:text-red-600 dark:prose-a:text-red-400 prose-strong:text-neutral-900 dark:prose-strong:text-white prose-code:text-red-700 prose-pre:bg-white dark:prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-200 dark:prose-pre:border-neutral-800 prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />
        </article>
      </div>
    </div>
  );
}
