'use client';

import DeploymentStepper from '@/components/dumb/DeploymentStepper';
import TerminalErrorBox from '@/components/dumb/TerminalErrorBox';
import type { DeployStreamState } from '@/hooks/useDeployStream';
import type { VmCreationPayload } from '@/types/forms';

interface DeploymentContainerProps {
  payload: VmCreationPayload;
  state: DeployStreamState;
  onReset: () => void;
}

export default function DeploymentContainer({
  payload,
  state,
  onReset,
}: DeploymentContainerProps) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 bg-blue-600" />
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-700 dark:text-neutral-300">
            Aprovisionamiento —{' '}
            <span className="text-neutral-900 dark:text-neutral-100">{payload.vm_name}</span>
          </span>
        </div>
        {!state.isStreaming && (
          <button
            onClick={onReset}
            className="rounded-sm border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Nueva VM
          </button>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">
        <DeploymentStepper
          phases={state.phases}
          progress={state.progress}
          lastMessage={state.isStreaming ? state.lastMessage : ''}
        />

        {state.error && (
          <TerminalErrorBox message={state.error} onRetry={onReset} />
        )}

        {state.isComplete && (
          <div className="border border-green-900/50 bg-green-950/20 px-4 py-3">
            <p className="font-mono text-xs font-semibold text-green-500 uppercase tracking-widest">
              VM Aprovisionada Exitosamente
            </p>
            <p className="font-mono text-[10px] text-green-600/70 mt-1">
              {payload.vm_name} · {payload.host} · {payload.datastore}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
