import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { VsphereInfrastructure } from '@/types/vmware';

const CACHE_KEY = 'vsphere_infra_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

interface LocalCache {
  data: VsphereInfrastructure;
  timestamp: number;
}

function readLocalCache(): VsphereInfrastructure | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const { data, timestamp }: LocalCache = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return undefined;
    }
    return data;
  } catch {
    return undefined;
  }
}

function writeLocalCache(data: VsphereInfrastructure): void {
  try {
    const payload: LocalCache = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage lleno o no disponible — ignorar
  }
}

async function fetchVsphereInfrastructure(): Promise<VsphereInfrastructure> {
  const res = await fetch('/api/vsphere');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as VsphereInfrastructure;
  writeLocalCache(data);
  return data;
}

export function useVsphereInfrastructure() {
  const queryClient = useQueryClient();

  // Carga el cache de localStorage DESPUÉS de la hidratación para evitar
  // mismatch servidor/cliente. useEffect solo corre en el cliente.
  useEffect(() => {
    const cached = readLocalCache();
    if (cached && !queryClient.getQueryData(['vsphere-infrastructure'])) {
      queryClient.setQueryData(['vsphere-infrastructure'], cached);
    }
  }, [queryClient]);

  return useQuery({
    queryKey: ['vsphere-infrastructure'],
    queryFn: fetchVsphereInfrastructure,
    staleTime: 5 * 60 * 1000,
  });
}
