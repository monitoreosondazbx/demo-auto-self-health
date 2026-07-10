import type { VmCreationPayload } from '@/types/forms';
import type { VsphereNetwork } from '@/types/vmware';
import SelectField from './SelectField';
import TextInputField from './TextInputField';
import SubmitButton from './SubmitButton';
import NetworkSelector from './NetworkSelector';

interface SelectOption {
  value: string;
  label: string;
}

interface VmCreationFormProps {
  clusters: SelectOption[];
  selectedCluster: string;
  onClusterChange: (value: string) => void;
  templates: SelectOption[];
  folders: SelectOption[];
  hosts: SelectOption[];
  datastores: SelectOption[];
  networks: VsphereNetwork[];
  form: VmCreationPayload;
  onFieldChange: <K extends keyof VmCreationPayload>(field: K, value: VmCreationPayload[K]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function StepHeader({
  step,
  label,
  description,
  isComplete = false,
}: {
  step: string;
  label: string;
  description: string;
  isComplete?: boolean;
}) {
  return (
    <div className="flex items-start gap-5 pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800">
      <span
        className={`font-mono text-3xl font-bold leading-none flex-shrink-0 tabular-nums transition-colors ${
          isComplete ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-200 dark:text-neutral-800'
        }`}
      >
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </p>
        <p className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600 mt-1">
          {description}
        </p>
      </div>
      {isComplete && (
        <div className="flex-shrink-0 w-5 h-5 bg-blue-600 flex items-center justify-center">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

function ComputeField({
  label,
  id,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 flex flex-col">
      <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
        <label
          htmlFor={id}
          className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500"
        >
          {label}
        </label>
      </div>
      <div className="flex items-center justify-between px-3 py-4 gap-1 bg-white dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 flex items-center justify-center font-mono text-lg text-neutral-300 dark:text-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors select-none"
          tabIndex={-1}
        >
          −
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums leading-none">
            {value}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
            {unit}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 flex items-center justify-center font-mono text-lg text-neutral-300 dark:text-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors select-none"
          tabIndex={-1}
        >
          +
        </button>
      </div>
      <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          min={min}
          max={max}
          className="w-full font-mono text-[10px] text-center text-neutral-400 dark:text-neutral-600 bg-transparent outline-none appearance-none py-1.5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label={`${label} (valor manual)`}
        />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex-shrink-0 w-16">
        {label}
      </span>
      <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300 truncate">
        {value}
      </span>
    </div>
  );
}

export default function VmCreationForm({
  clusters,
  selectedCluster,
  onClusterChange,
  templates,
  folders,
  hosts,
  datastores,
  networks,
  form,
  onFieldChange,
  onSubmit,
  isSubmitting,
}: VmCreationFormProps) {
  const section1Complete =
    form.vm_name.trim() !== '' && form.template !== '' && form.folder !== '';
  const section2Complete =
    selectedCluster !== '' && form.host !== '' && form.datastore !== '';
  const section3Complete = form.network !== '';
  const section5Complete =
    form.guest_username.trim() !== '' && form.guest_password.trim() !== '';

  const isFormValid =
    form.vm_name.trim() !== '' &&
    form.template !== '' &&
    form.folder !== '' &&
    form.host !== '' &&
    form.datastore !== '' &&
    form.guest_username.trim() !== '' &&
    form.guest_password.trim() !== '';

  const completedSections = [
    section1Complete,
    section2Complete,
    section3Complete,
    true,
    section5Complete,
  ];

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
        <div className="w-1 h-5 bg-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-700 dark:text-neutral-300 block">
            Nueva Máquina Virtual
          </span>
          <span className="font-mono text-[9px] text-neutral-400 dark:text-neutral-600">
            Aprovisionamiento automatizado · vCenter + n8n
          </span>
        </div>
        <div className="flex items-center gap-1">
          {completedSections.map((done, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 transition-colors duration-300 ${
                done ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-8">
        {/* 01 — IDENTIDAD */}
        <section>
          <StepHeader
            step="01"
            label="Identidad de la VM"
            description="Nombre único, plantilla de clonación y carpeta de destino"
            isComplete={section1Complete}
          />
          <div className="flex flex-col gap-4">
            <TextInputField
              label="Nombre de la VM"
              id="vm_name"
              value={form.vm_name}
              onChange={(v) => onFieldChange('vm_name', v)}
              placeholder="PROD-APP-001"
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Plantilla"
                id="template"
                value={form.template}
                options={templates}
                onChange={(v) => onFieldChange('template', v)}
              />
              <SelectField
                label="Carpeta de destino"
                id="folder"
                value={form.folder}
                options={folders}
                onChange={(v) => onFieldChange('folder', v)}
              />
            </div>
          </div>
        </section>

        {/* 02 — INFRAESTRUCTURA */}
        <section>
          <StepHeader
            step="02"
            label="Infraestructura vCenter"
            description="Cluster de destino, host ESXi y datastore de almacenamiento"
            isComplete={section2Complete}
          />
          <div className="flex flex-col gap-4">
            <SelectField
              label="Cluster"
              id="cluster"
              value={selectedCluster}
              options={clusters}
              onChange={onClusterChange}
              placeholder="Seleccionar cluster..."
            />
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Host ESXi"
                id="host"
                value={form.host}
                options={hosts}
                onChange={(v) => onFieldChange('host', v)}
                placeholder={
                  selectedCluster ? 'Seleccionar host...' : 'Selecciona un cluster primero'
                }
                disabled={!selectedCluster}
              />
              <SelectField
                label="Datastore"
                id="datastore"
                value={form.datastore}
                options={datastores}
                onChange={(v) => onFieldChange('datastore', v)}
                placeholder={form.host ? 'Seleccionar datastore...' : 'Selecciona un host primero'}
                disabled={!form.host}
              />
            </div>
          </div>
        </section>

        {/* 03 — RED */}
        <section>
          <StepHeader
            step="03"
            label="Red y Conectividad"
            description="VLAN de vSphere y dirección IP estática (opcional)"
            isComplete={section3Complete}
          />
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Red vSphere
            </label>
            <NetworkSelector
              networks={networks}
              selectedNetwork={form.network}
              selectedIp={form.ip}
              onNetworkChange={(v) => onFieldChange('network', v)}
              onIpChange={(v) => onFieldChange('ip', v)}
            />
          </div>
        </section>

        {/* 04 — RECURSOS DE CÓMPUTO */}
        <section>
          <StepHeader
            step="04"
            label="Recursos de Cómputo"
            description="Asignación de procesadores virtuales, memoria RAM y almacenamiento"
            isComplete
          />
          <div className="grid grid-cols-3 gap-4">
            <ComputeField
              label="Procesadores"
              id="cpu"
              value={form.cpu}
              onChange={(v) => onFieldChange('cpu', v)}
              min={1}
              max={64}
              unit="vCPUs"
            />
            <ComputeField
              label="Memoria RAM"
              id="memory_gb"
              value={form.memory_gb}
              onChange={(v) => onFieldChange('memory_gb', v)}
              min={1}
              max={512}
              unit="GB"
            />
            <ComputeField
              label="Almacenamiento"
              id="disk_gb"
              value={form.disk_gb}
              onChange={(v) => onFieldChange('disk_gb', v)}
              min={10}
              max={4096}
              unit="GB"
            />
          </div>
        </section>

        {/* 05 — CREDENCIALES */}
        <section>
          <StepHeader
            step="05"
            label="Credenciales de Acceso"
            description="Usuario y contraseña del sistema operativo guest"
            isComplete={section5Complete}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInputField
              label="Usuario"
              id="guest_username"
              value={form.guest_username}
              onChange={(v) => onFieldChange('guest_username', v)}
              placeholder="admin"
            />
            <TextInputField
              label="Contraseña"
              id="guest_password"
              value={form.guest_password}
              onChange={(v) => onFieldChange('guest_password', v)}
              type="password"
              placeholder="••••••••"
            />
          </div>
        </section>

        {/* SUBMIT */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex flex-col gap-4">
          {isFormValid && (
            <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 p-4">
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
                Resumen del despliegue
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <SummaryItem label="VM" value={form.vm_name} />
                <SummaryItem label="Plantilla" value={form.template} />
                <SummaryItem label="Host" value={form.host} />
                <SummaryItem label="DS" value={form.datastore} />
                <SummaryItem label="CPU" value={`${form.cpu} vCPUs`} />
                <SummaryItem label="Memoria" value={`${form.memory_gb} GB`} />
                <SummaryItem label="Disco" value={`${form.disk_gb} GB`} />
                {form.network && <SummaryItem label="Red" value={form.network} />}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-600">
              {isFormValid
                ? '5/5 secciones completadas'
                : 'Complete los campos requeridos para continuar'}
            </span>
            <SubmitButton
              label="Aprovisionar VM"
              onClick={onSubmit}
              disabled={!isFormValid}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
