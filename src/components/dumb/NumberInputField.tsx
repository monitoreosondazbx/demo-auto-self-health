interface NumberInputFieldProps {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
}

export default function NumberInputField({
  label,
  id,
  value,
  onChange,
  min,
  max,
  unit,
  disabled = false,
}: NumberInputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
      >
        {label}
        {unit && (
          <span className="ml-1 text-neutral-400 dark:text-neutral-500 normal-case tracking-normal">
            ({unit})
          </span>
        )}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        disabled={disabled}
        className="rounded-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-sm px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
