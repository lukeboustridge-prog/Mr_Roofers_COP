// Temporarily removed auth for debugging
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-green-500 p-8">
      <h1 className="text-2xl font-bold text-white mb-4">Dashboard Layout - NO AUTH</h1>
      <p className="text-white mb-4">If you see green, layout renders without auth.</p>
      <div className="bg-white rounded-lg shadow p-6">
        {children}
      </div>
    </div>
  );
}
