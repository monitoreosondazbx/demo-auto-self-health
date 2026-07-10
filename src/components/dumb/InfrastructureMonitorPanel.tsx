import Link from 'next/link';
import type { VsphereHost, VsphereDatastore } from '@/types/vmware';
import { scoreHosts, scoreDatastores, buildAlerts } from '@/lib/scoring';
import { bytesToTB } from '@/lib/formatters';

interface Props {
  hosts: VsphereHost[];
  datastores: VsphereDatastore[];
}

function MiniBar({ percent }: { percent: number }) {
  const cls =
    percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800">
      <div className={`h-full ${cls}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? 'text-green-600 dark:text-green-400'
      : score >= 40
        ? 'text-amber-500'
        : 'text-red-500';
  const barCls =
    score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800">
        <div className={`h-full ${barCls}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`font-mono text-[10px] w-12 text-right ${cls}`}>{score}/100</span>
    </div>
  );
}

function SectionHeader({ label, dot }: { label: string; dot?: 'red' | 'amber' | 'green' | 'blue' }) {
  const dotCls = {
    red: 'bg-red-500 animate-pulse',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  }[dot ?? 'blue'];
  return (
    <div className="px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
      {dot && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />}
      {!dot && <div className="w-1 h-3 bg-blue-600 flex-shrink-0" />}
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}

export default function InfrastructureMonitorPanel({ hosts, datastores }: Props) {
  const hostScores = scoreHosts(hosts);
  const dsScores = scoreDatastores(datastores);
  const alerts = buildAlerts(hosts, datastores);

  const bestHost = hostScores.find((s) => s.isEligible);
  const bestDs = dsScores.find((s) => s.isEligible);

  const connectedOk = hosts.filter(
    (h) => h.connection_state === 'connected' && !h.maintenance_mode,
  ).length;
  const criticals = alerts.filter((a) => a.kind === 'critical').length;
  const warnings = alerts.filter((a) => a.kind === 'warning').length;
  const highLoadDs = dsScores.filter((d) => d.usedPct >= 80).length;

  return (
    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {/* ── Estado global ──────────────────────────────────────────── */}
      <SectionHeader
        label="Estado global"
        dot={criticals > 0 ? 'red' : warnings > 0 ? 'amber' : 'green'}
      />
      <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800">
        <div className="px-5 py-4 flex flex-col gap-1">
          <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">
            {connectedOk}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            Hosts OK
          </span>
          <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
            de {hosts.length} total
          </span>
        </div>
        <div className="px-5 py-4 flex flex-col gap-1">
          <span
            className={`font-mono text-2xl font-bold leading-none ${criticals > 0 ? 'text-red-500' : 'text-neutral-900 dark:text-neutral-100'}`}
          >
            {criticals}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            Críticos
          </span>
          <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
            {warnings} advertencias
          </span>
        </div>
        <div className="px-5 py-4 flex flex-col gap-1">
          <span
            className={`font-mono text-2xl font-bold leading-none ${highLoadDs > 0 ? 'text-amber-500' : 'text-neutral-900 dark:text-neutral-100'}`}
          >
            {highLoadDs}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            DS con carga alta
          </span>
          <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
            de {datastores.length} datastores
          </span>
        </div>
      </div>

      {/* ── Recomendación ──────────────────────────────────────────── */}
      <div>
        <div className="px-5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-blue-600" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Recomendación — nueva VM
            </span>
          </div>
          {bestHost && (
            <Link
              href="/provision"
              className="font-mono text-[10px] px-2.5 py-1 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
            >
              + Aprovisionar →
            </Link>
          )}
        </div>

        {bestHost ? (
          <div className="px-5 py-4 flex flex-col gap-4">
            {/* Best host card */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Host óptimo
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {bestHost.score}/100
                </span>
              </div>
              <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {bestHost.host.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500">
                    {bestHost.host.cluster}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                      RAM
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">
                      {bestHost.ramPct}%
                    </span>
                  </div>
                  <MiniBar percent={bestHost.ramPct} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[9px] text-neutral-400">
                    {bestHost.host.vm_count} VMs activas
                  </span>
                  <span className="font-mono text-[9px] text-neutral-400">
                    ESXi {bestHost.host.esxi_version}
                  </span>
                </div>
                <ScoreGauge score={bestHost.score} />
              </div>
            </div>

            {/* Best datastore card */}
            {bestDs && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Datastore óptimo
                  </span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {bestDs.freePct}% libre
                  </span>
                </div>
                <div className="border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {bestDs.datastore.name}
                    </span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                      {bestDs.datastore.type}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                        Ocupación
                      </span>
                      <span className="font-mono text-[9px] text-neutral-500">
                        {bestDs.usedPct}%
                      </span>
                    </div>
                    <MiniBar percent={bestDs.usedPct} />
                  </div>
                  <span className="font-mono text-[9px] text-neutral-400">
                    {bytesToTB(bestDs.datastore.free_space, 1)} libres de{' '}
                    {bytesToTB(bestDs.datastore.capacity, 1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest">
              Sin hosts elegibles para despliegue
            </span>
          </div>
        )}
      </div>

      {/* ── Alertas ────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div>
          <SectionHeader
            label={`Alertas (${alerts.length})`}
            dot={criticals > 0 ? 'red' : 'amber'}
          />
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {alerts.map((a, i) => (
              <div key={i} className="px-5 py-2.5 flex items-start gap-3">
                <div
                  className={`w-0.5 h-full min-h-[2rem] flex-shrink-0 mt-0.5 ${
                    a.kind === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                    {a.resource}
                  </span>
                  <span
                    className={`font-mono text-[10px] ${a.kind === 'critical' ? 'text-red-500' : 'text-amber-500'}`}
                  >
                    {a.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="mx-5 my-4 border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20 px-4 py-2.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-mono text-[10px] text-green-700 dark:text-green-400 uppercase tracking-widest">
            Sin incidencias activas
          </span>
        </div>
      )}

      {/* ── Ranking de hosts ───────────────────────────────────────── */}
      <div>
        <SectionHeader label="Ranking hosts — disponibilidad" />
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {hostScores.map((hs, idx) => (
            <div
              key={hs.host.name}
              className={`px-5 py-2.5 flex items-center gap-3 ${!hs.isEligible ? 'opacity-50' : ''}`}
            >
              <span className="font-mono text-[10px] text-neutral-300 dark:text-neutral-700 w-4 flex-shrink-0 text-right">
                {idx + 1}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  hs.host.maintenance_mode
                    ? 'bg-amber-500'
                    : hs.host.connection_state === 'connected'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                }`}
              />
              <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 flex-1 min-w-0 truncate">
                {hs.host.name}
                {idx === 0 && hs.isEligible && (
                  <span className="ml-2 font-mono text-[8px] px-1 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider align-middle">
                    recomendado
                  </span>
                )}
              </span>
              <div className="w-16 flex-shrink-0">
                <MiniBar percent={hs.ramPct} />
              </div>
              {hs.isEligible ? (
                <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 w-14 text-right flex-shrink-0">
                  {hs.score}/100
                </span>
              ) : (
                <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600 w-14 text-right flex-shrink-0 truncate">
                  {hs.ineligibleReason}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
