'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useVsphereInfrastructure } from '@/hooks/useVsphereInfrastructure';
import { useDeployStream } from '@/hooks/useDeployStream';
import VmCreationForm from '@/components/dumb/VmCreationForm';
import DeploymentContainer from '@/components/smart/DeploymentContainer';
import FormSkeleton from '@/components/dumb/FormSkeleton';
import HostInfoCard from '@/components/dumb/HostInfoCard';
import VmSpecPreview from '@/components/dumb/VmSpecPreview';
import type { VmCreationPayload } from '@/types/forms';
import { setDeployingState } from '@/lib/deploy-gate';

const INITIAL_FORM: VmCreationPayload = {
  vm_name: '',
  template: '',
  folder: '',
  host: '',
  datastore: '',
  cpu: 2,
  memory_gb: 4,
  disk_gb: 40,
  guest_username: '',
  guest_password: '',
  network: '',
  ip: '',
};

export default function VmCreationContainer() {
  const { data: infrastructure, isLoading } = useVsphereInfrastructure();
  const [form, setForm] = useState<VmCreationPayload>(INITIAL_FORM);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [submittedPayload, setSubmittedPayload] = useState<VmCreationPayload | null>(null);

  const { state: deployState, startStream, resetStream } = useDeployStream();

  // Sincroniza el estado de deploy con el AppHeader (y bloquea salida accidental)
  useEffect(() => {
    setDeployingState(deployState.isStreaming);
    return () => { setDeployingState(false); };
  }, [deployState.isStreaming]);

  // Bloquea refresh/cierre de pestaña durante deploy activo
  useEffect(() => {
    if (!deployState.isStreaming) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [deployState.isStreaming]);

  // Bloquea el botón "atrás" del navegador durante deploy activo
  useEffect(() => {
    if (!deployState.isStreaming) return;
    history.pushState(null, '', window.location.href);
    const handler = () => history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [deployState.isStreaming]);

  const availableTemplates = useMemo(
    () => (infrastructure?.templates ?? []).map((t) => ({ value: t, label: t })),
    [infrastructure],
  );

  const availableFolders = useMemo(
    () =>
      (infrastructure?.folders ?? [])
        .filter((f) => f.type === 'VIRTUAL_MACHINE')
        .map((f) => ({ value: f.name, label: f.name })),
    [infrastructure],
  );

  const availableClusters = useMemo(
    () =>
      (infrastructure?.clusters ?? []).map((c) => ({
        value: c.name,
        label: `${c.name}${c.drs_enabled ? ' · DRS' : ''}${c.ha_enabled ? ' · HA' : ''}`,
      })),
    [infrastructure],
  );

  const availableHosts = useMemo(() => {
    if (!infrastructure || !selectedCluster) return [];
    return infrastructure.hosts
      .filter(
        (h) =>
          h.cluster === selectedCluster &&
          h.connection_state === 'connected' &&
          !h.maintenance_mode,
      )
      .map((h) => {
        const ramPct =
          h.memory_total_mb > 0
            ? Math.round(((h.memory_total_mb - h.memory_free_mb) / h.memory_total_mb) * 100)
            : 0;
        return {
          value: h.name,
          label: `${h.name} — ${h.vm_count} VMs · ${ramPct}% RAM`,
        };
      });
  }, [infrastructure, selectedCluster]);

  const availableDatastores = useMemo(() => {
    if (!infrastructure || !form.host) return [];
    const selectedHost = infrastructure.hosts.find((h) => h.name === form.host);
    if (!selectedHost) return [];
    return infrastructure.datastores
      .filter((ds) => selectedHost.datastores.some((hds) => hds.name === ds.name))
      .map((ds) => {
        const hostDs = selectedHost.datastores.find((hds) => hds.name === ds.name);
        const suffix = hostDs ? `${hostDs.free} libre de ${hostDs.total}` : ds.type;
        return { value: ds.name, label: `${ds.name} — ${suffix}` };
      });
  }, [infrastructure, form.host]);

  const selectedHostData = useMemo(() => {
    if (!infrastructure || !form.host) return null;
    return infrastructure.hosts.find((h) => h.name === form.host) ?? null;
  }, [infrastructure, form.host]);

  const availableNetworks = useMemo(
    () => infrastructure?.networks ?? [],
    [infrastructure],
  );

  const handleClusterChange = useCallback((cluster: string) => {
    setSelectedCluster(cluster);
    setForm((prev) => ({ ...prev, host: '', datastore: '' }));
  }, []);

  const handleFieldChange = useCallback(
    <K extends keyof VmCreationPayload>(field: K, value: VmCreationPayload[K]) => {
      setForm((prev) => {
        if (field === 'host') return { ...prev, host: value as string, datastore: '' };
        if (field === 'network') return { ...prev, network: value as string, ip: '' };
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  function handleSubmit() {
    setSubmittedPayload(form);
    void startStream(form);
  }

  function handleReset() {
    resetStream();
    setSubmittedPayload(null);
    setForm(INITIAL_FORM);
    setSelectedCluster('');
  }

  if (submittedPayload) {
    return (
      <DeploymentContainer
        payload={submittedPayload}
        state={deployState}
        onReset={handleReset}
      />
    );
  }

  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
      <VmCreationForm
        clusters={availableClusters}
        selectedCluster={selectedCluster}
        onClusterChange={handleClusterChange}
        templates={availableTemplates}
        folders={availableFolders}
        hosts={availableHosts}
        datastores={availableDatastores}
        networks={availableNetworks}
        form={form}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        isSubmitting={false}
      />
      <div className="flex flex-col gap-4">
        <VmSpecPreview form={form} />
        <HostInfoCard host={selectedHostData} selectedDatastore={form.datastore} />
      </div>
    </div>
  );
}
