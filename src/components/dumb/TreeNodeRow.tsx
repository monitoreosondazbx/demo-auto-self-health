import type { TreeNodeData } from '@/types/tree';

interface TreeNodeRowProps {
  node: TreeNodeData;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

const STATUS_DOT: Record<NonNullable<TreeNodeData['statusDot']>, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

function inlinePercent(node: TreeNodeData): number | null {
  if (node.kind === 'host' && node.rawHost) {
    const h = node.rawHost;
    return h.memory_total_mb > 0
      ? Math.round(((h.memory_total_mb - h.memory_free_mb) / h.memory_total_mb) * 100)
      : null;
  }
  if (node.kind === 'datastore' && node.rawDatastore) {
    const ds = node.rawDatastore;
    return ds.capacity > 0
      ? Math.round(((ds.capacity - ds.free_space) / ds.capacity) * 100)
      : null;
  }
  return null;
}

export default function TreeNodeRow({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
}: TreeNodeRowProps) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = node.id === selectedId;
  const isSection = node.kind === 'section';
  const pct = inlinePercent(node);
  const barColor =
    pct !== null
      ? pct >= 85
        ? 'bg-red-500'
        : pct >= 70
          ? 'bg-amber-500'
          : 'bg-blue-400'
      : '';

  function handleRowClick() {
    if (hasChildren) onToggle(node.id);
    if (!isSection) onSelect(node.id);
  }

  function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation();
    onToggle(node.id);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleRowClick();
        }}
        className={`flex items-center gap-2 py-1.5 pr-3 cursor-pointer select-none transition-colors border-l-2 ${
          isSelected
            ? 'bg-blue-500/5 border-blue-500 dark:border-blue-400'
            : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        } ${isSection ? 'mt-2' : ''}`}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
      >
        {/* Chevron */}
        <button
          onClick={hasChildren ? handleChevronClick : undefined}
          tabIndex={-1}
          aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
          className={`w-3 h-3 flex items-center justify-center flex-shrink-0 transition-colors ${
            hasChildren
              ? 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300'
              : 'invisible'
          }`}
        >
          <svg
            viewBox="0 0 6 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-2 h-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path d="M1 1l4 4-4 4" />
          </svg>
        </button>

        {/* Status dot */}
        {node.statusDot ? (
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[node.statusDot]}`} />
        ) : (
          <div className="w-1.5 flex-shrink-0" />
        )}

        {/* Label + badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`font-mono truncate ${
              isSection
                ? 'text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-medium'
                : `text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-800 dark:text-neutral-200'}`
            }`}
          >
            {node.label}
          </span>

          {node.badge && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 whitespace-nowrap flex-shrink-0">
              {node.badge}
            </span>
          )}
        </div>

        {/* Inline percent */}
        {pct !== null && (
          <span className={`font-mono text-[9px] flex-shrink-0 ${pct >= 85 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-neutral-400 dark:text-neutral-600'}`}>
            {pct}%
          </span>
        )}
      </div>

      {/* Sublabel + inline resource bar */}
      {!isSection && (node.sublabel ?? pct !== null) && (
        <div style={{ paddingLeft: `${(depth + 1) * 16 + 20}px`, paddingRight: '12px' }}>
          {node.sublabel && (
            <div className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600 pb-0.5 truncate">
              {node.sublabel}
            </div>
          )}
          {pct !== null && (
            <div className="h-0.5 bg-neutral-100 dark:bg-neutral-800 mb-1">
              <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
