import type { VsphereInfrastructure } from '@/types/vmware';
import type { TreeNodeData } from '@/types/tree';
import { bytesToTB } from './formatters';

export function buildInfraTree(infra: VsphereInfrastructure): TreeNodeData[] {
  // ── CLUSTERS ──────────────────────────────────────────────────────────────
  const clusterNodes: TreeNodeData[] = infra.clusters.map((c) => {
    const clusterHosts = infra.hosts.filter((h) => h.cluster === c.name);
    const totalVMs = clusterHosts.reduce((sum, h) => sum + h.vm_count, 0);

    const hostNodes: TreeNodeData[] = clusterHosts.map((h) => {
      let statusDot: TreeNodeData['statusDot'] = 'green';
      if (h.maintenance_mode) statusDot = 'amber';
      else if (h.connection_state !== 'connected') statusDot = 'red';

      return {
        id: `host-${h.name}`,
        kind: 'host' as const,
        label: h.name,
        sublabel: `ESXi ${h.esxi_version}`,
        badge: `${h.vm_count} VMs`,
        statusDot,
        rawHost: h,
      };
    });

    const badgeParts = [c.drs_enabled && 'DRS', c.ha_enabled && 'HA'].filter(Boolean);

    return {
      id: `cluster-${c.name}`,
      kind: 'cluster' as const,
      label: c.name,
      badge: badgeParts.length > 0 ? badgeParts.join('·') : undefined,
      sublabel: `${clusterHosts.length} hosts · ${totalVMs} VMs`,
      children: hostNodes,
      rawCluster: c,
    };
  });

  // ── DATASTORES ────────────────────────────────────────────────────────────
  const datastoreNodes: TreeNodeData[] = infra.datastores.map((ds) => {
    const usedPct =
      ds.capacity > 0
        ? Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100)
        : 0;

    let statusDot: TreeNodeData['statusDot'] = 'green';
    if (usedPct >= 85) statusDot = 'red';
    else if (usedPct >= 70) statusDot = 'amber';

    return {
      id: `datastore-${ds.datastore}`,
      kind: 'datastore' as const,
      label: ds.name,
      badge: ds.type,
      sublabel: `${bytesToTB(ds.free_space)} libres de ${bytesToTB(ds.capacity)}`,
      statusDot,
      rawDatastore: ds,
    };
  });

  // ── CARPETAS (solo VIRTUAL_MACHINE) ───────────────────────────────────────
  const folderNodes: TreeNodeData[] = infra.folders
    .filter((f) => f.type === 'VIRTUAL_MACHINE')
    .map((f) => ({
      id: `folder-${f.folder}`,
      kind: 'folder' as const,
      label: f.name,
      rawFolder: f,
    }));

  // ── REDES ─────────────────────────────────────────────────────────────────
  const networkNodes: TreeNodeData[] = infra.networks.map((n) => ({
    id: `network-${n.network}`,
    kind: 'network' as const,
    label: n.name,
    badge: n.available_ips.length > 0 ? `${n.available_ips.length} IPs` : undefined,
    sublabel: n.subnet || undefined,
    rawNetwork: n,
  }));

  return [
    {
      id: 'section-clusters',
      kind: 'section',
      label: 'CLUSTERS',
      badge: String(infra.clusters.length),
      children: clusterNodes,
    },
    {
      id: 'section-datastores',
      kind: 'section',
      label: 'DATASTORES',
      badge: String(infra.datastores.length),
      children: datastoreNodes,
    },
    {
      id: 'section-folders',
      kind: 'section',
      label: 'CARPETAS',
      badge: String(folderNodes.length),
      children: folderNodes,
    },
    {
      id: 'section-networks',
      kind: 'section',
      label: 'REDES',
      badge: String(infra.networks.length),
      children: networkNodes,
    },
  ];
}

export function findNode(nodes: TreeNodeData[], id: string): TreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
