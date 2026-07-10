import Link from 'next/link';
import DashboardContainer from '@/components/smart/DashboardContainer';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">
              Infraestructura vCenter
            </h1>
            <p className="font-mono text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              Estado en tiempo real del cluster
            </p>
          </div>
          <Link
            href="/provision"
            className="rounded-sm bg-blue-600 hover:bg-blue-700 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-white transition-colors"
          >
            + Aprovisionar VM
          </Link>
        </div>
        <DashboardContainer />
      </div>
    </div>
  );
}
