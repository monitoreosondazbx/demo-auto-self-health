import VmCreationContainer from '@/components/smart/VmCreationContainer';

const DEPLOY_PHASES = [
  { id: '01', label: 'Validación' },
  { id: '02', label: 'Clonación' },
  { id: '03', label: 'Encendido' },
  { id: '04', label: 'Verificación' },
];

export default function ProvisionPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">
              Crear Máquina Virtual
            </h1>
            <p className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500 mt-1">
              Aprovisionamiento automatizado · vCenter + n8n
            </p>
          </div>

          {/* Deploy pipeline indicator */}
          <div className="hidden md:flex items-center">
            {DEPLOY_PHASES.map((phase, i) => (
              <div key={phase.id} className="flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                  <span className="font-mono text-[8px] text-neutral-300 dark:text-neutral-700 tabular-nums">
                    {phase.id}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {phase.label}
                  </span>
                </div>
                {i < DEPLOY_PHASES.length - 1 && (
                  <div className="w-3 h-px bg-neutral-200 dark:bg-neutral-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        <VmCreationContainer />
      </div>
    </div>
  );
}
