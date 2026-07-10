'use client';

import { useState, useRef, useCallback } from 'react';
import { SSE_PHASES } from '@/types/sse';
import type { PhaseState, SseChunk, SseStatus } from '@/types/sse';
import type { VmCreationPayload } from '@/types/forms';

export interface DeployStreamState {
  phases: PhaseState[];
  lastMessage: string;
  progress: number;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
}

function buildInitialPhases(): PhaseState[] {
  return SSE_PHASES.map((p) => ({ ...p, status: 'pending' as const }));
}

function resolvePhases(
  phases: PhaseState[],
  progress: number,
  status: SseStatus,
): PhaseState[] {
  const isError = (status as string).startsWith('error_');
  return phases.map((phase, idx) => {
    if (isError) {
      if (progress >= phase.minProgress && progress <= phase.maxProgress)
        return { ...phase, status: 'error' };
      if (progress >= phase.maxProgress) return { ...phase, status: 'completed' };
      return { ...phase, status: 'pending' };
    }
    if (progress >= phase.maxProgress) return { ...phase, status: 'completed' };
    if (progress >= phase.minProgress) return { ...phase, status: 'active' };
    // Si la fase anterior acaba de completarse, esta ya está en ejecución (spinner).
    if (idx > 0 && progress >= phases[idx - 1].maxProgress) return { ...phase, status: 'active' };
    return { ...phase, status: 'pending' };
  });
}

const INITIAL_STATE: DeployStreamState = {
  phases: buildInitialPhases(),
  lastMessage: '',
  progress: 0,
  isStreaming: false,
  isComplete: false,
  error: null,
};

export function useDeployStream() {
  const [state, setState] = useState<DeployStreamState>(INITIAL_STATE);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const startStream = useCallback(async (payload: VmCreationPayload) => {
    setState({
      ...INITIAL_STATE,
      phases: resolvePhases(buildInitialPhases(), 0, 'validando_recursos'),
      isStreaming: true,
    });

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.body) throw new Error('La respuesta de /api/deploy no tiene body.');

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        // Recopilar todos los chunks válidos de este único read()
        const batch: SseChunk[] = [];
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            batch.push(JSON.parse(line.slice(6)) as SseChunk);
          } catch {
            continue;
          }
        }

        // Ordenar por progreso para corregir entrega fuera de orden de n8n.
        batch.sort((a, b) => a.progress - b.progress);

        // Si llegan varios chunks juntos (batch del flush final), animamos uno por uno.
        // Si llegan de a uno (streaming real), la pausa es 0 → sin delay extra.
        const interPhaseDelay = batch.length > 1 ? 800 : 0;

        for (const chunk of batch) {
          if (interPhaseDelay > 0) {
            await new Promise<void>((r) => setTimeout(r, interPhaseDelay));
          }

          const isError = (chunk.status as string).startsWith('error_');

          setState((prev) => ({
            ...prev,
            phases: resolvePhases(prev.phases, chunk.progress, chunk.status),
            lastMessage: chunk.message,
            progress: chunk.progress,
            isStreaming: !isError && chunk.progress < 100,
            isComplete: !isError && chunk.progress >= 100,
            error: isError ? chunk.message : null,
          }));

          if (isError) {
            reader.cancel();
            return;
          }
        }
      }

      setState((prev) => ({ ...prev, isStreaming: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido en el stream.';
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: message,
        phases: prev.phases.map((p, i) => (i === 0 ? { ...p, status: 'error' } : p)),
      }));
    }
  }, []);

  const resetStream = useCallback(() => {
    readerRef.current?.cancel();
    readerRef.current = null;
    setState({ ...INITIAL_STATE, phases: buildInitialPhases() });
  }, []);

  return { state, startStream, resetStream };
}
