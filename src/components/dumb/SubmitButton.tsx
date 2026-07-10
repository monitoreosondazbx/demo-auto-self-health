interface SubmitButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export default function SubmitButton({
  label,
  onClick,
  disabled = false,
  isSubmitting = false,
}: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className="rounded-sm bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 text-white disabled:text-neutral-400 dark:disabled:text-neutral-600 font-mono text-xs uppercase tracking-widest px-8 py-3 transition-colors disabled:cursor-not-allowed flex items-center gap-3 flex-shrink-0"
    >
      {isSubmitting ? (
        <>
          <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin flex-shrink-0" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          {!disabled && (
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              fill="none"
              className="flex-shrink-0"
            >
              <path
                d="M1 5H11M7 1L11 5L7 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </>
      )}
    </button>
  );
}
