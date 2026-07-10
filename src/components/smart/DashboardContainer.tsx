'use client';

import { useMemo, useState, useEffect } from 'react';
import { useVsphereInfrastructure } from '@/hooks/useVsphereInfrastructure';
import InfrastructureOverview from '@/components/dumb/InfrastructureOverview';
import { bytesToTB } from '@/lib/formatters';

const LOADING_MESSAGES = [
  'Cargando...',
  'Consultando recursos de infraestructura...',
  'Conectando con vCenter...',
  'Obteniendo lista de hosts disponibles...',
  'Verificando datastores...',
  'Calculando capacidad de almacenamiento...',
  'Consultando plantillas configuradas...',
] as const;

function DashboardSkeleton() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Spinner central + mensajes ciclados */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center justify-center py-14 gap-6">
        {/* Marco industrial con spinner */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Esquinas de acento azul */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500" />
          {/* Rueda de carga */}
          <div className="w-7 h-7 border-2 border-neutral-200 dark:border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
        </div>

        {/* Texto ciclado */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
            {LOADING_MESSAGES[msgIdx]}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            vCenter · n8n · infraestructura
          </span>
        </div>

        {/* Dots de actividad */}
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-px w-4 ${i <= (msgIdx % 5) ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800'} transition-colors duration-300`}
            />
          ))}
        </div>
      </div>

      {/* Skeleton cards atenuados */}
      <div className="flex flex-col gap-8 animate-pulse opacity-40">
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
        <div className="h-10 bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-20 bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardContainer() {
  const { data: infrastructure, isLoading, error } = useVsphereInfrastructure();

  const metrics = useMemo(() => {
    if (!infrastructure) return null;

    const connectedHosts = infrastructure.hosts.filter(
      (h) => h.connection_state === 'connected',
    ).length;
    const totalVMs = infrastructure.hosts.reduce((sum, h) => sum + h.vm_count, 0);
    const totalStorageBytes = infrastructure.datastores.reduce((sum, ds) => sum + ds.capacity, 0);
    const freeStorageBytes = infrastructure.datastores.reduce((sum, ds) => sum + ds.free_space, 0);
    const storageUsedPercent =
      totalStorageBytes > 0
        ? Math.round(((totalStorageBytes - freeStorageBytes) / totalStorageBytes) * 100)
        : 0;

    return {
      clusterCount: infrastructure.clusters.length,
      connectedHosts,
      totalHosts: infrastructure.hosts.length,
      totalVMs,
      templateCount: infrastructure.templates.length,
      storageFreeTB: bytesToTB(freeStorageBytes),
      storageTotalTB: bytesToTB(totalStorageBytes),
      storageUsedPercent,
    };
  }, [infrastructure]);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !metrics || !infrastructure) {
    return (
      <div className="border border-red-900 bg-neutral-950 px-4 py-3">
        <p className="font-mono text-xs text-red-400">
          Error al cargar datos de infraestructura. Verifica la conexión con el servidor n8n.
        </p>
      </div>
    );
  }

  return (
    <InfrastructureOverview
      metrics={metrics}
      hosts={infrastructure.hosts}
      clusters={infrastructure.clusters}
    />
  );
}
