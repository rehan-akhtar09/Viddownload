'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  categoryName?: string;
  createdAt?: string;
  author?: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/blogs');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-16 md:py-24">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Blog</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Tips, guides, and news about video downloading</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium">No blog posts yet</p>
            <p className="text-sm text-neutral-400 mt-1">Check back soon for new content.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={'/blog/' + post.slug}
                className="block p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800 transition-all group"
              >
                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-2">
                  {post.createdAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {post.categoryName && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-medium">
                      {post.categoryName}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="mt-3 flex items-center gap-1 text-sm text-red-600 dark:text-red-400 font-medium group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
