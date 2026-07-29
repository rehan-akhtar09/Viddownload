'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/auth-context';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
