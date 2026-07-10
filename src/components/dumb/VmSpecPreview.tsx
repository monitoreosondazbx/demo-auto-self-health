import type { VmCreationPayload } from '@/types/forms';

interface VmSpecPreviewProps {
  form: VmCreationPayload;
}

const REQUIRED_FIELDS: (keyof VmCreationPayload)[] = [
  'vm_name',
  'template',
  'folder',
  'host',
  'datastore',
  'guest_username',
  'guest_password',
];

function ResourceBlock({
  value,
  unit,
  label,
}: {
  value: number | string;
  unit: string;
  label: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5">
      <span className="font-mono text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-none tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[9px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {unit}
      </span>
      <span className="font-mono text-[8px] text-neutral-300 dark:text-neutral-700 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function PreviewRow({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex-shrink-0">
        {label}
      </span>
      <span
        className={`font-mono text-xs text-right truncate ${
          dim ? 'text-neutral-400 dark:text-neutral-600 italic' : 'text-neutral-800 dark:text-neutral-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function VmSpecPreview({ form }: VmSpecPreviewProps) {
  const filled = REQUIRED_FIELDS.filter((f) => {
    const v = form[f];
    return typeof v === 'string' ? v.trim() !== '' : Boolean(v);
  }).length;
  const total = REQUIRED_FIELDS.length;
  const completionPct = Math.round((filled / total) * 100);

  const isReady = filled === total;

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
        <div className={`w-1 h-4 flex-shrink-0 ${isReady ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex-1">
          Vista Previa
        </span>
        {isReady && (
          <span className="font-mono text-[8px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">
            Listo
          </span>
        )}
      </div>

      {/* VM name */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">
          Nombre de la VM
        </p>
        <p
          className={`font-mono text-lg font-bold leading-tight break-all ${
            form.vm_name.trim()
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-300 dark:text-neutral-700'
          }`}
        >
          {form.vm_name.trim() || '—'}
        </p>
        {(form.template || form.folder) && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {form.template && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {form.template}
              </span>
            )}
            {form.folder && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {form.folder}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Resource blocks */}
      <div className="flex divide-x divide-neutral-100 dark:divide-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
        <ResourceBlock value={form.cpu} unit="vCPUs" label="CPU" />
        <ResourceBlock value={form.memory_gb} unit="GB" label="Mem" />
        <ResourceBlock value={form.disk_gb} unit="GB" label="Disco" />
      </div>

      {/* Infra + network details */}
      <div className="px-4 py-3 flex flex-col border-b border-neutral-100 dark:border-neutral-800">
        {form.host && (
          <PreviewRow label="Host" value={form.host} />
        )}
        {form.datastore && (
          <PreviewRow label="DS" value={form.datastore} />
        )}
        {form.network ? (
          <PreviewRow label="Red" value={form.network} />
        ) : (
          <PreviewRow label="Red" value="Sin asignar" dim />
        )}
        {form.ip ? (
          <PreviewRow label="IP" value={form.ip} />
        ) : (
          <PreviewRow label="IP" value="Desconectada" dim />
        )}
      </div>

      {/* Completion bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
            Completado
          </span>
          <span className={`font-mono text-[9px] ${isReady ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}`}>
            {filled}/{total} campos
          </span>
        </div>
        <div className="h-1 bg-neutral-100 dark:bg-neutral-800">
          <div
            className={`h-full transition-all duration-300 ${isReady ? 'bg-blue-600' : 'bg-neutral-400 dark:bg-neutral-600'}`}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
