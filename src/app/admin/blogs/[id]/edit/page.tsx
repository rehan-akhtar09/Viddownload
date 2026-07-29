'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import BlogEditor from '@/components/admin/BlogEditor';

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'blogs', id));
      if (snap.exists()) {
        setBlog({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!blog) {
    return         <p className="text-gray-500">Blog not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Edit Blog Post</h1>
      <BlogEditor existing={blog} />
    </div>
  );
}
