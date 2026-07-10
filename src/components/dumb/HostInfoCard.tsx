import type { VsphereHost, HostDatastoreSummary } from '@/types/vmware';
import { formatMemoryMB, memoryUsedPercent, parseSizeGB } from '@/lib/formatters';

interface HostInfoCardProps {
  host: VsphereHost | null;
  selectedDatastore?: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 flex-shrink-0">
        {label}
      </span>
      <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 text-right">
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-neutral-100 dark:border-neutral-800" />;
}

// SVG donut — r = 15.9155 → circumference ≈ 100 (para usar % directo)
function DonutChart({ usedPct, label }: { usedPct: number; label: string }) {
  const color =
    usedPct >= 90 ? '#dc2626' : usedPct >= 70 ? '#f59e0b' : '#2563eb';
  const freeColor = 'currentColor';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg
          viewBox="0 0 36 36"
          className="w-full h-full -rotate-90"
        >
          {/* Track */}
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none"
            stroke="rgb(229 229 229)"
            strokeWidth="3.5"
            className="dark:stroke-neutral-800"
          />
          {/* Used arc */}
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${usedPct} 100`}
            strokeLinecap="butt"
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100 leading-none">
            {usedPct}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 mt-0.5">
            usado
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 text-center">
        {label}
      </p>
    </div>
  );
}

function DatastoreDetail({ ds }: { ds: HostDatastoreSummary }) {
  const totalGB = parseSizeGB(ds.total);
  const freeGB = parseSizeGB(ds.free);
  const usedPct = totalGB > 0 ? Math.round(((totalGB - freeGB) / totalGB) * 100) : 0;

  return (
    <div>
      <DonutChart usedPct={usedPct} label={ds.name} />
      <div className="mt-4 flex flex-col gap-1.5 border border-neutral-100 dark:border-neutral-800 px-3 py-2.5">
        <Row label="Libre" value={ds.free} />
        <Row label="Usado" value={`${usedPct}%`} />
        <Row label="Total" value={ds.total} />
      </div>
    </div>
  );
}

function EmptyPlaceholder() {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-6">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
        <div className="w-1 h-10 bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 flex flex-col gap-1.5 pt-0.5">
          <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
          <div className="h-2.5 w-16 bg-neutral-100 dark:bg-neutral-800/60 rounded-none" />
          <div className="h-2.5 w-20 bg-neutral-100 dark:bg-neutral-800/60 rounded-none" />
        </div>
      </div>
      <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
        <div className="w-6 h-6 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-1">
          <div className="w-2.5 h-2.5 bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
          Selecciona un host ESXi
        </p>
        <p className="font-mono text-[10px] text-neutral-300 dark:text-neutral-700 leading-relaxed max-w-[160px]">
          Los detalles de hardware, RAM y datastores aparecerán aquí
        </p>
      </div>
    </div>
  );
}

export default function HostInfoCard({ host, selectedDatastore }: HostInfoCardProps) {
  if (!host) return <EmptyPlaceholder />;

  const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);
  const ramUsedMB = host.memory_total_mb - host.memory_free_mb;
  const ramBarColor =
    ramPct >= 90 ? 'bg-red-600' : ramPct >= 70 ? 'bg-amber-500' : 'bg-blue-600';

  const activeDs = selectedDatastore
    ? host.datastores.find((ds) => ds.name === selectedDatastore)
    : null;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
        <div className="w-1 h-10 bg-blue-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {host.name}
          </p>
          <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">{host.cluster}</p>
          <p className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 truncate">
            {host.vendor} {host.model}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Status + ESXi */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 flex-shrink-0" />
          <span className="font-mono text-[10px] text-neutral-500">Connected</span>
          <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            ESXi {host.esxi_version}
          </span>
        </div>

        <Divider />

        {/* VMs + CPU */}
        <div className="flex flex-col gap-2">
          <Row label="VMs activas" value={String(host.vm_count)} />
          <Row label="Cores / Threads" value={`${host.cpu_cores}c / ${host.cpu_threads}t`} />
          <p className="font-mono text-[10px] text-neutral-500 leading-snug break-words">
            {host.cpu_model}
          </p>
        </div>

        <Divider />

        {/* RAM */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              RAM
            </span>
            <span className="font-mono text-xs tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
              {ramPct}%
            </span>
          </div>
          <div className="h-1 bg-neutral-200 dark:bg-neutral-800 mb-1.5">
            <div
              className={`h-1 ${ramBarColor} transition-all duration-300`}
              style={{ width: `${ramPct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[10px] text-neutral-500">
              {formatMemoryMB(ramUsedMB)} usado
            </span>
            <span className="font-mono text-[10px] text-neutral-500">
              {formatMemoryMB(host.memory_total_mb)} total
            </span>
          </div>
        </div>

        {/* Datastores section */}
        {host.datastores.length > 0 && (
          <>
            <Divider />
            {activeDs ? (
              /* Datastore seleccionado → donut chart */
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-3">
                  Datastore seleccionado
                </p>
                <DatastoreDetail ds={activeDs} />
              </div>
            ) : (
              /* Sin datastore → lista completa */
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-2">
                  Datastores ({host.datastores.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {host.datastores.map((ds) => (
                    <div
                      key={ds.name}
                      className="border border-neutral-100 dark:border-neutral-800 px-2 py-2"
                    >
                      <p className="font-mono text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {ds.name}
                      </p>
                      <p className="font-mono text-[10px] text-neutral-500 mt-0.5">
                        {ds.free} libre / {ds.total}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
