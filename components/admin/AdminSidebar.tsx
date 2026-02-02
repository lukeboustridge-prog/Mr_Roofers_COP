'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Layers,
  AlertTriangle,
  Download,
  ChevronLeft,
  Library,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sources', label: 'Content Sources', icon: Library },
  { href: '/admin/details', label: 'Details', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: Layers },
  { href: '/admin/links', label: 'Content Links', icon: Link2 },
  { href: '/admin/failures', label: 'Case Law', icon: AlertTriangle },
  { href: '/admin/export', label: 'Export / Import', icon: Download },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-slate-50">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Admin CMS</h2>
            <p className="text-xs text-slate-500">Content Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-red-100 text-red-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-4" />

        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to App
        </Link>
      </nav>

      <div className="border-t p-4 bg-white">
        <p className="text-xs text-slate-500">
          MRM Code of Practice
        </p>
        <p className="text-xs text-slate-400">
          Admin Panel v1.0
        </p>
      </div>
    </aside>
  );
}
