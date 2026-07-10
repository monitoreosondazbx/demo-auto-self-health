'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useDeployingState } from '@/lib/deploy-gate';

interface AppHeaderProps {
  title?: string;
}

const NAV_LINKS = [
  { href: '/', label: 'DASHBOARD' },
  { href: '/infrastructure', label: 'EXPLORADOR' },
  { href: '/provision', label: 'APROVISIONAR' },
];

export default function AppHeader({ title = 'VM Automation Platform' }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isDeploying = useDeployingState();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleThemeToggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6 py-0 flex items-stretch justify-between">
      {/* Left: logo + nav */}
      <div className="flex items-stretch gap-0">
        <div className="flex items-center gap-3 pr-6 border-r border-neutral-200 dark:border-neutral-800">
          <div className={`w-1.5 h-5 ${isDeploying ? 'bg-amber-500 animate-pulse' : 'bg-blue-600'}`} />
          <span className="font-mono text-xs font-semibold tracking-widest uppercase text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            {title}
          </span>
        </div>

        <nav className="flex items-stretch">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const isLocked = isDeploying && !isActive;

            if (isLocked) {
              return (
                <span
                  key={link.href}
                  title="Aprovisionamiento en curso — navegación bloqueada"
                  className="flex items-center gap-1.5 px-4 font-mono text-[10px] uppercase tracking-widest border-b-2 border-transparent text-neutral-300 dark:text-neutral-700 cursor-not-allowed select-none"
                >
                  <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 10 12" fill="currentColor">
                    <rect x="1" y="5" width="8" height="7" rx="0" />
                    <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                  </svg>
                  {link.label}
                </span>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Indicador de aprovisionamiento activo */}
        {isDeploying && (
          <div className="flex items-center gap-2 px-4 border-l border-neutral-200 dark:border-neutral-800">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Aprovisionando
            </span>
          </div>
        )}
      </div>

      {/* Right: theme toggle */}
      <div className="flex items-center py-3">
        <button
          onClick={handleThemeToggle}
          disabled={!mounted}
          aria-label="Toggle theme"
          className="rounded-sm border border-neutral-200 dark:border-neutral-700 px-3 py-1 font-mono text-xs text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-0"
        >
          {mounted ? (theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE') : null}
        </button>
      </div>
    </header>
  );
}
