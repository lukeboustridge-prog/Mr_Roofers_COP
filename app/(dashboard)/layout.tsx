import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { SkipLinks } from '@/components/layout/SkipLinks';

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
        {/* Skip links for keyboard accessibility */}
        <SkipLinks />

        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main
            id="main-content"
            className="flex-1 overflow-auto pb-20 lg:pb-0"
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </StoreProvider>
  );
}
