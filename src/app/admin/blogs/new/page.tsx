'use client';

import BlogEditor from '@/components/admin/BlogEditor';

export default function NewBlogPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">New Blog Post</h1>
      <BlogEditor />
    </div>
  );
}
