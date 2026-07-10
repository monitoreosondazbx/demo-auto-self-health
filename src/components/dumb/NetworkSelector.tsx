'use client';

import { useState, useRef, useEffect } from 'react';
import type { VsphereNetwork } from '@/types/vmware';

interface NetworkSelectorProps {
  networks: VsphereNetwork[];
  selectedNetwork: string;
  selectedIp: string;
  onNetworkChange: (networkName: string) => void;
  onIpChange: (ip: string) => void;
  disabled?: boolean;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3 h-3 text-neutral-400 transition-transform duration-150 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 4l4 4 4-4" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

export default function NetworkSelector({
  networks,
  selectedNetwork,
  selectedIp,
  onNetworkChange,
  onIpChange,
  disabled = false,
}: NetworkSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const withIps = networks
    .filter((n) => n.available_ips.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const noIps = networks
    .filter((n) => n.available_ips.length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const selected = networks.find((n) => n.name === selectedNetwork) ?? null;

  function handleSelect(network: VsphereNetwork) {
    if (network.available_ips.length === 0) return;
    onNetworkChange(network.name);
    onIpChange('');
    setOpen(false);
  }

  const triggerBase =
    'w-full flex items-center justify-between px-3 py-2 border font-mono text-xs text-left transition-colors';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Network dropdown ── */}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={`${triggerBase} ${
            disabled
              ? 'border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-600 cursor-not-allowed bg-neutral-50 dark:bg-neutral-950'
              : open
              ? 'border-blue-500 dark:border-blue-500 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
              : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 hover:border-neutral-500 dark:hover:border-neutral-500 cursor-pointer'
          }`}
        >
          {selected ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate">{selected.name}</span>
              {selected.subnet !== 'UNKNOWN' && (
                <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                  {selected.subnet}
                </span>
              )}
            </span>
          ) : (
            <span className="text-neutral-400 dark:text-neutral-500">Seleccionar red...</span>
          )}
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-px border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-20 max-h-72 overflow-y-auto">
            {/* Con IPs */}
            {withIps.length > 0 && (
              <>
                <div className="sticky top-0 px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                    Con IPs disponibles — {withIps.length} redes
                  </span>
                </div>
                {withIps.map((n) => (
                  <button
                    key={n.network}
                    type="button"
                    onClick={() => handleSelect(n)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                      selectedNetwork === n.name
                        ? 'bg-blue-50 dark:bg-blue-950/30'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex flex-col gap-px min-w-0 mr-3">
                      <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100 truncate">
                        {n.name}
                      </span>
                      {n.subnet !== 'UNKNOWN' && (
                        <span className="font-mono text-[10px] text-neutral-400">{n.subnet}</span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 flex-shrink-0 whitespace-nowrap">
                      {n.available_ips.length} IP{n.available_ips.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </>
            )}

            {/* Sin IPs */}
            {noIps.length > 0 && (
              <>
                <div
                  className={`sticky top-0 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 ${
                    withIps.length > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                    Sin IPs disponibles — no elegibles
                  </span>
                </div>
                {noIps.map((n) => (
                  <div
                    key={n.network}
                    className="flex items-center justify-between px-3 py-2.5 cursor-not-allowed"
                  >
                    <div className="flex flex-col gap-px min-w-0">
                      <span className="font-mono text-xs text-neutral-300 dark:text-neutral-600 truncate">
                        {n.name}
                      </span>
                      {n.subnet !== 'UNKNOWN' && (
                        <span className="font-mono text-[10px] text-neutral-300 dark:text-neutral-700">
                          {n.subnet}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── IP selector (solo aparece si la red tiene IPs) ── */}
      {selected && selected.available_ips.length > 0 && (
        <select
          value={selectedIp}
          onChange={(e) => onIpChange(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
        >
          <option value="">— Sin IP (desconectada)</option>
          {selected.available_ips.map((ip) => (
            <option key={ip} value={ip}>
              {ip}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
