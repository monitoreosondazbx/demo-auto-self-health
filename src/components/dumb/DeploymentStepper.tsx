'use client';

import { useState, useEffect } from 'react';
import type { PhaseState } from '@/types/sse';

interface DeploymentStepperProps {
  phases: PhaseState[];
  progress: number;
  lastMessage: string;
}

function PhaseTimer({ status }: { status: PhaseState['status'] }) {
  const [seconds, setSeconds] = useState(0);
  const isActive = status === 'active';

  useEffect(() => {
    if (status === 'pending') setSeconds(0);
  }, [status]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  if (status === 'pending') return null;

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const display = min > 0 ? `${min}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`;

  const color =
    status === 'active'
      ? 'text-blue-400'
      : status === 'error'
        ? 'text-red-400/70'
        : 'text-neutral-400 dark:text-neutral-600';

  return (
    <span className={`font-mono text-[10px] tabular-nums shrink-0 ${color}`}>
      {display}
    </span>
  );
}

function PhaseIndicator({ status }: { status: PhaseState['status'] }) {
  const base = 'w-6 h-6 flex items-center justify-center border font-mono text-xs flex-shrink-0';
  if (status === 'completed')
    return <div className={`${base} border-green-600 bg-green-600/10 text-green-500`}>✓</div>;
  if (status === 'active')
    return (
      <div className={`${base} border-blue-500 bg-blue-500/10`}>
        <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (status === 'error')
    return <div className={`${base} border-red-600 bg-red-600/10 text-red-500`}>✗</div>;
  return (
    <div className={`${base} border-neutral-300 dark:border-neutral-700`}>
      <div className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700" />
    </div>
  );
}

function connectorColor(status: PhaseState['status']): string {
  if (status === 'completed') return 'bg-green-600/30';
  if (status === 'error') return 'bg-red-600/30';
  return 'bg-neutral-200 dark:bg-neutral-800';
}

function labelColor(status: PhaseState['status']): string {
  if (status === 'active') return 'text-blue-600 dark:text-blue-400';
  if (status === 'completed') return 'text-green-600 dark:text-green-400';
  if (status === 'error') return 'text-red-600 dark:text-red-400';
  return 'text-neutral-400 dark:text-neutral-600';
}

export default function DeploymentStepper({
  phases,
  progress,
  lastMessage,
}: DeploymentStepperProps) {
  return (
    <div>
      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            Progreso general
          </span>
          <span className="font-mono text-xs tabular-nums text-neutral-900 dark:text-neutral-100">
            {progress}%
          </span>
        </div>
        <div className="h-0.5 bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-0.5 bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fases */}
      <div className="flex flex-col">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <PhaseIndicator status={phase.status} />
              {idx < phases.length - 1 && (
                <div
                  className={`w-px flex-1 mt-1 min-h-[28px] ${connectorColor(phase.status)}`}
                />
              )}
            </div>
            <div className={`flex-1 min-w-0 ${idx < phases.length - 1 ? 'pb-7' : 'pb-0'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`font-mono text-xs font-semibold ${labelColor(phase.status)}`}>
                  {phase.label}
                </p>
                <PhaseTimer status={phase.status} />
              </div>
              <p className="font-mono text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5 leading-relaxed">
                {phase.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje en vivo */}
      {lastMessage && (
        <div className="mt-6 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 py-2.5">
          <p className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 break-all leading-relaxed">
            {lastMessage}
          </p>
        </div>
      )}
    </div>
  );
}
