'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
          <div className="h-14 w-14 rounded-full bg-green-600/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Message Sent!</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Thank you for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Contact Us</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">We&apos;d love to hear from you</p>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
            <p className="leading-relaxed">
              Have a question, suggestion, or need help? Fill out the form and we&apos;ll respond within 24 hours.
            </p>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 space-y-2">
              <p className="font-semibold text-neutral-900 dark:text-white">Email Us Directly</p>
              <a
                href="mailto:rehan.ibex04@gmail.com"
                className="text-red-600 dark:text-red-400 hover:underline break-all"
              >
                rehan.ibex04@gmail.com
              </a>
            </div>
            <p className="text-xs leading-relaxed">
              We respect your privacy. Your information will only be used to respond to your inquiry.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-shadow"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-shadow"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-shadow"
              >
                <option value="">Select a subject</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Copyright Issue">Copyright Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-shadow resize-y"
                placeholder="Write your message here..."
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {status === 'sending' ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
