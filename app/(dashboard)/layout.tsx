import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PWAProvider } from '@/components/providers/PWAProvider';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

// Check if Clerk is configured
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only check auth if Clerk is configured
  if (hasClerkKey) {
    try {
      const { userId } = await auth();
      if (!userId) {
        redirect('/sign-in');
      }
    } catch (error) {
      // Auth failed - likely middleware not configured
      // Allow access but log the error
      console.error('Auth check failed:', error);
    }
  }

  return (
    <PWAProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-20 lg:pb-0">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </PWAProvider>
  );
}
