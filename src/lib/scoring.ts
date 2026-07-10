import type { VsphereHost, VsphereDatastore } from '@/types/vmware';
import { memoryUsedPercent } from './formatters';

export interface HostScore {
  host: VsphereHost;
  score: number;           // 0–100, higher = better for VM placement
  ramPct: number;
  isEligible: boolean;
  ineligibleReason?: string;
}

export interface DatastoreScore {
  datastore: VsphereDatastore;
  score: number;           // 0–100, higher = more free space
  usedPct: number;
  freePct: number;
  isEligible: boolean;
}

export interface InfraAlert {
  kind: 'critical' | 'warning';
  resource: string;
  message: string;
}

// Score = RAM freedom (65%) + VM count freedom (35%)
// Ineligible: disconnected, maintenance, or RAM >= 90%
export function scoreHosts(hosts: VsphereHost[]): HostScore[] {
  const eligibleVmCounts = hosts
    .filter((h) => h.connection_state === 'connected' && !h.maintenance_mode)
    .map((h) => h.vm_count);
  const maxVms = eligibleVmCounts.length > 0 ? Math.max(...eligibleVmCounts) : 0;

  return hosts
    .map((host) => {
      const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);

      if (host.connection_state !== 'connected') {
        return { host, score: 0, ramPct, isEligible: false, ineligibleReason: 'Desconectado' };
      }
      if (host.maintenance_mode) {
        return { host, score: 0, ramPct, isEligible: false, ineligibleReason: 'Mantenimiento' };
      }
      if (ramPct >= 90) {
        return { host, score: 0, ramPct, isEligible: false, ineligibleReason: `RAM ${ramPct}%` };
      }

      const ramFree = (100 - ramPct) / 100;
      const vmFreedom = maxVms > 0 ? 1 - host.vm_count / (maxVms + 1) : 1;
      const score = Math.round((ramFree * 0.65 + vmFreedom * 0.35) * 100);

      return { host, score, ramPct, isEligible: true };
    })
    .sort((a, b) => b.score - a.score);
}

// Score = free space percentage. Ineligible when < 5% free.
export function scoreDatastores(datastores: VsphereDatastore[]): DatastoreScore[] {
  return datastores
    .map((ds) => {
      const usedPct =
        ds.capacity > 0
          ? Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100)
          : 100;
      const freePct = 100 - usedPct;

      return {
        datastore: ds,
        score: freePct,
        usedPct,
        freePct,
        isEligible: freePct >= 5,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildAlerts(
  hosts: VsphereHost[],
  datastores: VsphereDatastore[],
): InfraAlert[] {
  const alerts: InfraAlert[] = [];

  for (const host of hosts) {
    if (host.connection_state !== 'connected') {
      alerts.push({ kind: 'critical', resource: host.name, message: 'Host desconectado' });
      continue;
    }
    if (host.maintenance_mode) {
      alerts.push({ kind: 'warning', resource: host.name, message: 'En mantenimiento' });
      continue;
    }
    const ramPct = memoryUsedPercent(host.memory_total_mb, host.memory_free_mb);
    if (ramPct >= 90) {
      alerts.push({ kind: 'critical', resource: host.name, message: `RAM ${ramPct}% usada` });
    } else if (ramPct >= 80) {
      alerts.push({ kind: 'warning', resource: host.name, message: `RAM ${ramPct}% usada` });
    }
  }

  for (const ds of datastores) {
    const usedPct =
      ds.capacity > 0
        ? Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100)
        : 100;
    if (usedPct >= 90) {
      alerts.push({ kind: 'critical', resource: ds.name, message: `Storage ${usedPct}% usado` });
    } else if (usedPct >= 80) {
      alerts.push({ kind: 'warning', resource: ds.name, message: `Storage ${usedPct}% usado` });
    }
  }

  return alerts;
}
