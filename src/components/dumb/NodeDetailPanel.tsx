import type { ReactNode } from 'react';
import type { TreeNodeData } from '@/types/tree';
import type {
  VsphereCluster,
  VsphereHost,
  VsphereDatastore,
  VsphereFolder,
  VsphereNetwork,
} from '@/types/vmware';
import { bytesToTB, formatMemoryMB, memoryUsedPercent } from '@/lib/formatters';

// ── Shared primitives ──────────────────────────────────────────────────────

function DetailHeader({ label, id }: { label: string; id?: string }) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 bg-blue-600" />
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
      </div>
      {id && (
        <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 mt-1 block pl-4">
          {id}
        </span>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="font-mono text-xs text-neutral-800 dark:text-neutral-200 text-right break-all">
        {value}
      </span>
    </div>
  );
}

function KpiCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-0.5">
      <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-1">
        {label}
      </span>
      {sub && (
        <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600 mt-0.5">
          {sub}
        </span>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
      {children}
    </span>
  );
}

function UsageBar({ percent, height = '2' }: { percent: number; height?: '1.5' | '2' | '3' }) {
  const colorClass =
    percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  const heightClass = { '1.5': 'h-1.5', '2': 'h-2', '3': 'h-3' }[height];
  return (
    <div className={`${heightClass} bg-neutral-100 dark:bg-neutral-800 w-full`}>
      <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function Chip({
  label,
  color = 'neutral',
}: {
  label: string;
  color?: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
}) {
  const cls = {
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  }[color];
  return (
    <span className={`inline-block font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}

// ── Cluster: fleet view ────────────────────────────────────────────────────

function HostMiniCard({ host }: { host: VsphereHost }) {
  const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);
  const dotClass = host.maintenance_mode
    ? 'bg-amber-500'
    : host.connection_state === 'connected'
      ? 'bg-green-500'
      : 'bg-red-500';

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
          <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300 truncate">
            {host.name}
          </span>
        </div>
        <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-500 flex-shrink-0">
          {host.vm_count} VMs
        </span>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">RAM</span>
          <span
            className={`font-mono text-[9px] ${ramPct >= 85 ? 'text-red-500' : ramPct >= 70 ? 'text-amber-500' : 'text-neutral-400'}`}
          >
            {ramPct}%
          </span>
        </div>
        <UsageBar percent={ramPct} height="1.5" />
      </div>

      <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
        ESXi {host.esxi_version}
      </span>
    </div>
  );
}

function ClusterDetail({
  cluster,
  hostNodes,
}: {
  cluster: VsphereCluster;
  hostNodes: TreeNodeData[];
}) {
  const hosts = hostNodes
    .map((n) => n.rawHost)
    .filter((h): h is VsphereHost => h !== undefined);
  const connected = hosts.filter((h) => h.connection_state === 'connected' && !h.maintenance_mode).length;
  const totalVMs = hosts.reduce((s, h) => s + h.vm_count, 0);

  return (
    <div>
      <DetailHeader label="Cluster" id={cluster.cluster} />
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <KpiCard
            value={String(hosts.length)}
            label="Hosts"
            sub={`${connected} conectados`}
          />
          <KpiCard value={String(totalVMs)} label="VMs" />
          <div className="border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Estado
            </span>
            <div className="flex flex-wrap gap-1">
              {cluster.drs_enabled && <Chip label="DRS" color="green" />}
              {cluster.ha_enabled && <Chip label="HA" color="green" />}
              {!cluster.drs_enabled && !cluster.ha_enabled && (
                <Chip label="Sin HA/DRS" color="neutral" />
              )}
            </div>
          </div>
        </div>

        {/* Host fleet */}
        {hosts.length > 0 && (
          <div>
            <SectionLabel>Fleet de hosts ({hosts.length})</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {hosts.map((h) => (
                <HostMiniCard key={h.name} host={h} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <DetailRow label="Nombre" value={cluster.name} />
          <DetailRow label="ID interno" value={cluster.cluster} />
        </div>
      </div>
    </div>
  );
}

// ── Host ──────────────────────────────────────────────────────────────────

function HostDetail({ host }: { host: VsphereHost }) {
  const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);
  const isConnected = host.connection_state === 'connected';

  return (
    <div>
      <DetailHeader label="Host ESXi" id={host.name} />
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Status badge row */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected && !host.maintenance_mode
                ? 'bg-green-500'
                : host.maintenance_mode
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
          />
          <span
            className={`font-mono text-xs ${
              isConnected && !host.maintenance_mode
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-500'
            }`}
          >
            {host.connection_state}
          </span>
          {host.maintenance_mode && <Chip label="Mantenimiento" color="amber" />}
        </div>

        {/* Big KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <KpiCard
            value={`${ramPct}%`}
            label="RAM usada"
            sub={`${formatMemoryMB(host.memory_total_mb - host.memory_free_mb)} / ${formatMemoryMB(host.memory_total_mb)}`}
          />
          <KpiCard value={String(host.vm_count)} label="VMs activas" />
        </div>

        {/* RAM bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Memoria RAM
            </span>
            <span
              className={`font-mono text-xs ${ramPct >= 85 ? 'text-red-500' : ramPct >= 70 ? 'text-amber-500' : 'text-neutral-500'}`}
            >
              {ramPct}%
            </span>
          </div>
          <UsageBar percent={ramPct} height="3" />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px] text-neutral-400">0</span>
            <span className="font-mono text-[9px] text-neutral-400">
              {formatMemoryMB(host.memory_total_mb)}
            </span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex flex-col gap-1 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <DetailRow label="Cluster" value={host.cluster} />
          <DetailRow label="CPU" value={`${host.cpu_cores} cores · ${host.cpu_threads} threads`} />
          <DetailRow label="Modelo CPU" value={host.cpu_model} />
          <DetailRow label="Servidor" value={`${host.vendor} ${host.model}`} />
          <DetailRow label="ESXi" value={`${host.esxi_version} (build ${host.esxi_build})`} />
        </div>

        {/* Datastores */}
        {host.datastores.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <SectionLabel>Datastores montados</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {host.datastores.map((ds) => (
                <div
                  key={ds.name}
                  className="flex items-center justify-between border border-neutral-100 dark:border-neutral-800 px-3 py-2"
                >
                  <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                    {ds.name}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                    {ds.free} / {ds.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Datastore ──────────────────────────────────────────────────────────────

function DatastoreDetail({ ds }: { ds: VsphereDatastore }) {
  const usedPct =
    ds.capacity > 0
      ? Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100)
      : 0;
  const usedBytes = ds.capacity - ds.free_space;

  return (
    <div>
      <DetailHeader label="Datastore" id={ds.datastore} />
      <div className="px-6 py-5 flex flex-col gap-5">
        <div>
          <Chip label={ds.type} color="blue" />
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-2">
          <KpiCard value={`${usedPct}%`} label="Usado" />
          <KpiCard value={bytesToTB(ds.free_space, 1)} label="Libre" />
          <KpiCard value={bytesToTB(ds.capacity, 1)} label="Total" />
        </div>

        {/* Prominent bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Capacidad
            </span>
            <span
              className={`font-mono text-xs ${usedPct >= 85 ? 'text-red-500' : usedPct >= 70 ? 'text-amber-500' : 'text-neutral-500'}`}
            >
              {usedPct}% usado
            </span>
          </div>
          <UsageBar percent={usedPct} height="3" />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px] text-neutral-400">0</span>
            <span className="font-mono text-[9px] text-neutral-400">{bytesToTB(ds.capacity, 1)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <DetailRow label="Nombre" value={ds.name} />
          <DetailRow label="Tipo" value={ds.type} />
          <DetailRow label="Libre" value={bytesToTB(ds.free_space)} />
          <DetailRow label="Usado" value={bytesToTB(usedBytes)} />
          <DetailRow label="Total" value={bytesToTB(ds.capacity)} />
          <DetailRow label="ID interno" value={ds.datastore} />
        </div>
      </div>
    </div>
  );
}

// ── Folder ─────────────────────────────────────────────────────────────────

function FolderDetail({ folder, templates }: { folder: VsphereFolder; templates: string[] }) {
  return (
    <div>
      <DetailHeader label="Carpeta VM" id={folder.folder} />
      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <DetailRow label="Nombre" value={folder.name} />
          <DetailRow label="Tipo" value={folder.type} />
          <DetailRow label="ID interno" value={folder.folder} />
        </div>

        {templates.length > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Plantillas disponibles</SectionLabel>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {templates.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {templates.map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2.5 border border-neutral-100 dark:border-neutral-800 px-3 py-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="w-0.5 h-4 bg-blue-600 flex-shrink-0" />
                  <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 truncate">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {templates.length === 0 && (
          <div className="border border-neutral-100 dark:border-neutral-800 px-4 py-6 text-center">
            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
              Sin plantillas registradas
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Network ────────────────────────────────────────────────────────────────

function NetworkDetail({ network }: { network: VsphereNetwork }) {
  const ipCount = network.available_ips.length;
  const MAX_DISPLAY = 12;
  const displayIps = network.available_ips.slice(0, MAX_DISPLAY);
  const remaining = ipCount - MAX_DISPLAY;

  return (
    <div>
      <DetailHeader label="Red" id={network.network} />
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <KpiCard
            value={String(ipCount)}
            label="IPs disponibles"
            sub={ipCount > 0 ? 'asignables' : 'sin pool'}
          />
          <KpiCard value={network.subnet || '—'} label="Subnet" />
        </div>

        <div className="flex flex-col gap-1">
          <DetailRow label="Nombre" value={network.name} />
          <DetailRow label="Tipo" value={network.type} />
          <DetailRow label="ID interno" value={network.network} />
        </div>

        {ipCount > 0 && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <SectionLabel>Pool de IPs</SectionLabel>
              {remaining > 0 && (
                <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
                  +{remaining} más
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {displayIps.map((ip) => (
                <span
                  key={ip}
                  className="font-mono text-[10px] px-2 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-center truncate"
                >
                  {ip}
                </span>
              ))}
            </div>
          </div>
        )}

        {ipCount === 0 && (
          <div className="border border-neutral-100 dark:border-neutral-800 px-4 py-5 text-center">
            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
              Sin IPs disponibles — solo conectividad L2
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

export default function NodeDetailPanel({
  node,
  templates,
}: {
  node: TreeNodeData;
  templates: string[];
}) {
  switch (node.kind) {
    case 'cluster':
      return node.rawCluster ? (
        <ClusterDetail cluster={node.rawCluster} hostNodes={node.children ?? []} />
      ) : null;
    case 'host':
      return node.rawHost ? <HostDetail host={node.rawHost} /> : null;
    case 'datastore':
      return node.rawDatastore ? <DatastoreDetail ds={node.rawDatastore} /> : null;
    case 'folder':
      return node.rawFolder ? (
        <FolderDetail folder={node.rawFolder} templates={templates} />
      ) : null;
    case 'network':
      return node.rawNetwork ? <NetworkDetail network={node.rawNetwork} /> : null;
    default:
      return null;
  }
}
