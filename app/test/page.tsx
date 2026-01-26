// Simple test page - no auth required
export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white">TEST PAGE WORKS!</h1>
      <p className="text-white mt-4">If you see this blue page, basic routing works.</p>
      <p className="text-white mt-2">Time: {new Date().toISOString()}</p>
    </div>
  );
}
