import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    // Auth check failed - will redirect below
    console.error('Auth check failed:', error);
  }

  // Redirect outside try-catch since redirect() throws
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Dashboard Layout Works!</h1>
      <p className="text-slate-600 mb-4">User ID: {userId}</p>
      <div className="bg-white rounded-lg shadow p-6">
        {children}
      </div>
    </div>
  );
}
