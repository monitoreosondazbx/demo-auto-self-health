function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-neutral-200 dark:bg-neutral-800 animate-pulse ${className}`} />;
}

function SkeletonField() {
  return (
    <div>
      <Pulse className="h-2.5 w-20 mb-2" />
      <Pulse className="h-9 w-full" />
    </div>
  );
}

export default function FormSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
      {/* Form skeleton */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        {/* Status banner */}
        <div className="px-6 py-2.5 border-b border-blue-600/20 bg-blue-600/5 flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Consultando recursos de infraestructura...
          </span>
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="w-1 h-4 bg-neutral-300 dark:bg-neutral-700" />
          <Pulse className="h-3 w-44" />
        </div>

        <div className="p-6 flex flex-col gap-8">
          <section>
            <Pulse className="h-px w-full mb-4" />
            <div className="grid grid-cols-1 gap-4">
              <SkeletonField />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonField />
                <SkeletonField />
              </div>
            </div>
          </section>

          <section>
            <Pulse className="h-px w-full mb-4" />
            <div className="grid grid-cols-1 gap-4">
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
            </div>
          </section>

          <section>
            <Pulse className="h-px w-full mb-4" />
            <div className="grid grid-cols-3 gap-4">
              <SkeletonField />
              <SkeletonField />
              <SkeletonField />
            </div>
          </section>

          <section>
            <Pulse className="h-px w-full mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonField />
              <SkeletonField />
            </div>
          </section>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6 flex justify-end">
            <Pulse className="h-9 w-36" />
          </div>
        </div>
      </div>

      {/* Panel placeholder skeleton */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
          <div className="w-1 h-10 bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-2.5 w-20" />
            <Pulse className="h-2.5 w-24" />
          </div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <Pulse className="h-4 w-full" />
          <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          <Pulse className="h-12 w-full" />
          <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          <Pulse className="h-16 w-full" />
          <div className="h-px bg-neutral-100 dark:bg-neutral-800" />
          <Pulse className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
