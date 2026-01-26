import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { StoreProvider } from '@/components/providers/StoreProvider';

// Auth is now handled by middleware - no need to check here
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}
