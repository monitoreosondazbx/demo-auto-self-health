import type { VsphereHost, VsphereCluster } from '@/types/vmware';
import { formatMemoryMB, memoryUsedPercent } from '@/lib/formatters';

interface InfrastructureMetrics {
  clusterCount: number;
  connectedHosts: number;
  totalHosts: number;
  totalVMs: number;
  templateCount: number;
  storageFreeTB: string;
  storageTotalTB: string;
  storageUsedPercent: number;
}

interface InfrastructureOverviewProps {
  metrics: InfrastructureMetrics;
  hosts: VsphereHost[];
  clusters: VsphereCluster[];
}

function KpiCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1.5">
        {label}
      </p>
      <p
        className={`font-mono text-2xl font-bold tabular-nums ${accent ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-neutral-100'}`}
      >
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[10px] text-neutral-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function StatusDot({ state }: { state: VsphereHost['connection_state'] }) {
  const colors: Record<VsphereHost['connection_state'], string> = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    notResponding: 'bg-amber-500',
  };
  return <div className={`w-1.5 h-1.5 flex-shrink-0 ${colors[state]}`} />;
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-1 h-4 bg-blue-600" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}

export default function InfrastructureOverview({
  metrics,
  hosts,
  clusters,
}: InfrastructureOverviewProps) {
  const storageBarColor =
    metrics.storageUsedPercent >= 85
      ? 'bg-red-600'
      : metrics.storageUsedPercent >= 70
        ? 'bg-amber-500'
        : 'bg-blue-600';

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Clusters" value={String(metrics.clusterCount)} />
        <KpiCard
          label="Hosts activos"
          value={String(metrics.connectedHosts)}
          sub={`de ${metrics.totalHosts} totales`}
          accent
        />
        <KpiCard label="VMs activas" value={String(metrics.totalVMs)} />
        <KpiCard label="Templates" value={String(metrics.templateCount)} />
        <KpiCard
          label="Storage libre"
          value={metrics.storageFreeTB}
          sub={`de ${metrics.storageTotalTB}`}
        />
        <KpiCard
          label="Storage usado"
          value={`${metrics.storageUsedPercent}%`}
          accent={metrics.storageUsedPercent >= 85}
        />
      </div>

      {/* Storage bar */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
            Capacidad de almacenamiento global
          </span>
          <span className="font-mono text-[10px] tabular-nums text-neutral-600 dark:text-neutral-400">
            {metrics.storageFreeTB} libre de {metrics.storageTotalTB}
          </span>
        </div>
        <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
          <div
            className={`h-1 ${storageBarColor} transition-all duration-500`}
            style={{ width: `${metrics.storageUsedPercent}%` }}
          />
        </div>
      </div>

      {/* Hosts table */}
      <div>
        <SectionLabel label={`Hosts ESXi (${hosts.length})`} />
        <div className="border border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-[2fr_2fr_56px_3fr_80px] gap-4 px-4 py-2 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800">
            {['Host IP', 'Cluster', 'VMs', 'RAM', 'Estado'].map((h) => (
              <span
                key={h}
                className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600"
              >
                {h}
              </span>
            ))}
          </div>

          {hosts.map((host) => {
            const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);
            const ramUsed = formatMemoryMB(host.memory_total_mb - host.memory_free_mb);
            const ramTotal = formatMemoryMB(host.memory_total_mb);
            const ramColor =
              ramPct >= 90 ? 'bg-red-600' : ramPct >= 70 ? 'bg-amber-500' : 'bg-blue-600';

            return (
              <div
                key={host.name}
                className="grid grid-cols-[2fr_2fr_56px_3fr_80px] gap-4 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
              >
                <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate self-center">
                  {host.name}
                </span>
                <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 truncate self-center">
                  {host.cluster}
                </span>
                <span className="font-mono text-xs tabular-nums text-neutral-900 dark:text-neutral-100 self-center">
                  {host.vm_count}
                </span>
                <div className="flex flex-col gap-1 justify-center">
                  <div className="h-0.5 bg-neutral-200 dark:bg-neutral-800">
                    <div className={`h-0.5 ${ramColor}`} style={{ width: `${ramPct}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500 tabular-nums">
                    {ramUsed} / {ramTotal} — {ramPct}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-center">
                  <StatusDot state={host.connection_state} />
                  <span className="font-mono text-[10px] text-neutral-500">
                    {host.connection_state === 'connected' ? 'OK' : 'ERR'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clusters */}
      {clusters.length > 0 && (
        <div>
          <SectionLabel label={`Clusters (${clusters.length})`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clusters.map((cluster) => (
              <div
                key={cluster.cluster}
                className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3"
              >
                <p className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2.5">
                  {cluster.name}
                </p>
                <div className="flex gap-2">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 border uppercase tracking-wider ${cluster.drs_enabled ? 'border-green-600/40 bg-green-600/10 text-green-600 dark:text-green-400' : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600'}`}
                  >
                    DRS {cluster.drs_enabled ? 'ON' : 'OFF'}
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 border uppercase tracking-wider ${cluster.ha_enabled ? 'border-blue-600/40 bg-blue-600/10 text-blue-600 dark:text-blue-400' : 'border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600'}`}
                  >
                    HA {cluster.ha_enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
