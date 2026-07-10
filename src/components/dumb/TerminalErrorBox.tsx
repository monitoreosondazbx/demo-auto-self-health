interface TerminalErrorBoxProps {
  message: string;
  onRetry: () => void;
}

export default function TerminalErrorBox({ message, onRetry }: TerminalErrorBoxProps) {
  return (
    <div className="border border-red-900 bg-neutral-950 dark:bg-black">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-red-900/40">
        <div className="w-1.5 h-1.5 bg-red-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-red-500">
          Error de Aprovisionamiento
        </span>
      </div>
      <div className="px-4 py-3">
        <pre className="font-mono text-xs text-red-400 whitespace-pre-wrap break-all leading-relaxed">
          {message}
        </pre>
      </div>
      <div className="px-3 pb-3">
        <button
          onClick={onRetry}
          className="rounded-sm border border-red-900 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-950 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
