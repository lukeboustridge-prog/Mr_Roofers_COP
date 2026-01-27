import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

// Force dynamic rendering for auth check
export const dynamic = 'force-dynamic';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  if (!admin) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
