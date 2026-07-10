'use client';

import { useState, useMemo } from 'react';
import { useVsphereInfrastructure } from '@/hooks/useVsphereInfrastructure';
import { buildInfraTree, findNode } from '@/lib/buildInfraTree';
import { buildAlerts } from '@/lib/scoring';
import InfrastructureTree from '@/components/dumb/InfrastructureTree';

const INITIAL_EXPANDED = new Set([
  'section-clusters',
  'section-datastores',
  'section-folders',
  'section-networks',
]);

export default function InfrastructureTreeContainer() {
  const { data: infrastructure, isLoading, error } = useVsphereInfrastructure();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(INITIAL_EXPANDED);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = useMemo(
    () => (infrastructure ? buildInfraTree(infrastructure) : []),
    [infrastructure],
  );

  const selectedNode = useMemo(
    () => (selectedId ? findNode(tree, selectedId) : null),
    [tree, selectedId],
  );

  const criticalCount = useMemo(() => {
    if (!infrastructure) return 0;
    return buildAlerts(infrastructure.hosts, infrastructure.datastores).filter(
      (a) => a.kind === 'critical',
    ).length;
  }, [infrastructure]);

  function handleToggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  if (isLoading) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-96 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Cargando topología...
          </span>
        </div>
      </div>
    );
  }

  if (error ?? !infrastructure) {
    return (
      <div className="border border-red-900 bg-neutral-950 px-4 py-3">
        <p className="font-mono text-xs text-red-400">
          Error al cargar datos de infraestructura. Verifica la conexión con el servidor n8n.
        </p>
      </div>
    );
  }

  return (
    <InfrastructureTree
      nodes={tree}
      expandedIds={expandedIds}
      selectedId={selectedId}
      selectedNode={selectedNode}
      templates={infrastructure.templates}
      hosts={infrastructure.hosts}
      datastores={infrastructure.datastores}
      criticalCount={criticalCount}
      onToggle={handleToggle}
      onSelect={handleSelect}
    />
  );
}
