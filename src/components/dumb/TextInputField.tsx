interface TextInputFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  disabled?: boolean;
}

export default function TextInputField({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
}: TextInputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        className="rounded-none border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-sm px-3 py-2 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
