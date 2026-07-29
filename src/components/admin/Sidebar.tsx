'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, FolderTree, LogOut, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth-context';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/blogs', label: 'Blogs', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-200">
        <Link href="/admin" className="font-extrabold text-lg text-gray-900 tracking-wider">
          AVD Admin
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          View Site
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
