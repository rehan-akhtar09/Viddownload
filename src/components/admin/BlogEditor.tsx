'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/auth-context';
import { Code, Eye } from 'lucide-react';

interface Props {
  existing?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    categoryId: string;
    published: boolean;
  };
}

function textToHtml(text: string): string {
  return text
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
    })
    .join('\n');
}

function htmlToText(html: string): string {
  return html
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function BlogEditor({ existing }: Props) {
  const router = useRouter();
  const { token } = useAdminAuth();
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState(existing?.title || '');
  const [slug, setSlug] = useState(existing?.slug || '');
  const [content, setContent] = useState(existing?.content || '');
  const [excerpt, setExcerpt] = useState(existing?.excerpt || '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId || '');
  const [saving, setSaving] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'html'>('text');
  const [textContent, setTextContent] = useState(existing?.content ? htmlToText(existing.content) : '');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCats(Array.isArray(data) ? data : []);
    })();
  }, []);

  const generateSlug = (v: string) =>
    v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!existing) setSlug(generateSlug(v));
  };

  const handleTextChange = (v: string) => {
    setTextContent(v);
    setContent(textToHtml(v));
  };

  const switchMode = (mode: 'text' | 'html') => {
    if (mode === 'html' && inputMode === 'text') {
      setContent(textToHtml(textContent));
    } else if (mode === 'text' && inputMode === 'html') {
      setTextContent(htmlToText(content));
    }
    setInputMode(mode);
  };

  const save = async (publish: boolean) => {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);

    const finalContent = inputMode === 'text' ? textToHtml(textContent) : content;

    const body = {
      title: title.trim(),
      slug: slug.trim(),
      content: finalContent,
      excerpt: excerpt.trim() || title.trim(),
      categoryId: categoryId || null,
      categoryName: cats.find((c) => c.id === categoryId)?.name || null,
      published: publish,
    };

    try {
      const res = existing
        ? await fetch('/api/admin/blogs/' + existing.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify(body),
          })
        : await fetch('/api/admin/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        router.push('/admin/blogs');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const displayContent = inputMode === 'text' ? textContent : content;

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
            className="admin-input w-full px-4 py-2.5 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            placeholder="Blog post title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))}
            className="admin-input w-full px-4 py-2.5 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            placeholder="blog-post-slug" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="admin-select w-full px-4 py-2.5 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40">
            <option value="">No category</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Excerpt</label>
          <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
            className="admin-input w-full px-4 py-2.5 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            placeholder="Brief summary" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-neutral-300">Content</label>
          <div className="flex items-center gap-1 bg-neutral-900 rounded-xl p-1 border border-white/10">
            <button type="button" onClick={() => switchMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === 'text' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
              <Eye className="h-3.5 w-3.5 inline mr-1" />Text
            </button>
            <button type="button" onClick={() => switchMode('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === 'html' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'}`}>
              <Code className="h-3.5 w-3.5 inline mr-1" />HTML
            </button>
          </div>
        </div>
        {inputMode === 'html' ? (
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20}
            className="admin-textarea w-full px-4 py-3 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-y"
            placeholder="Write your blog content in HTML..." />
        ) : (
          <textarea value={textContent} onChange={(e) => handleTextChange(e.target.value)} rows={20}
            className="admin-textarea w-full px-4 py-3 rounded-xl border border-white/10 bg-neutral-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-y"
            placeholder="Write your blog content here..." />
        )}
      </div>

      {content && (
        <div className="border border-white/10 rounded-xl p-4 bg-neutral-900/50">
          <p className="text-xs text-neutral-500 mb-2">Preview</p>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-red-400 prose-strong:text-white prose-code:text-red-300 prose-pre:bg-neutral-800"
            dangerouslySetInnerHTML={{ __html: inputMode === 'text' ? textToHtml(textContent) : content }} />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => save(true)} disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all">
          {saving ? 'Saving...' : existing ? 'Update & Publish' : 'Publish'}
        </button>
        <button onClick={() => save(false)} disabled={saving}
          className="px-6 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-all">
          Save as Draft
        </button>
      </div>
    </div>
  );
}
