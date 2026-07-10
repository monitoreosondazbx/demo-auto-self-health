import type { VsphereHost, VsphereDatastore } from '@/types/vmware';
import type { TreeNodeData } from '@/types/tree';
import TreeNodeRow from './TreeNodeRow';
import NodeDetailPanel from './NodeDetailPanel';
import InfrastructureMonitorPanel from './InfrastructureMonitorPanel';

interface InfrastructureTreeProps {
  nodes: TreeNodeData[];
  expandedIds: Set<string>;
  selectedId: string | null;
  selectedNode: TreeNodeData | null;
  templates: string[];
  hosts: VsphereHost[];
  datastores: VsphereDatastore[];
  criticalCount: number;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

export default function InfrastructureTree({
  nodes,
  expandedIds,
  selectedId,
  selectedNode,
  templates,
  hosts,
  datastores,
  criticalCount,
  onToggle,
  onSelect,
}: InfrastructureTreeProps) {
  const healthDot =
    criticalCount > 0
      ? 'bg-red-500 animate-pulse'
      : 'bg-green-500';

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex min-h-[600px]">
      {/* LEFT: árbol */}
      <div className="w-72 flex-shrink-0 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto">
        <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5 flex items-center gap-2 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="w-1 h-3 bg-blue-600" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex-1">
            Topología
          </span>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${healthDot}`} />
        </div>

        <div className="py-1 pb-4">
          {nodes.map((node) => (
            <TreeNodeRow
              key={node.id}
              node={node}
              depth={0}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* RIGHT: detalle o monitor */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode ? (
          <NodeDetailPanel node={selectedNode} templates={templates} />
        ) : (
          <InfrastructureMonitorPanel hosts={hosts} datastores={datastores} />
        )}
      </div>
    </div>
  );
}
