import InfrastructureTreeContainer from '@/components/smart/InfrastructureTreeContainer';

export default function InfrastructurePage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Explorador de Infraestructura
          </h1>
          <p className="font-mono text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Topología de vCenter — clusters, hosts, datastores y redes
          </p>
        </div>
        <InfrastructureTreeContainer />
      </div>
    </div>
  );
}
