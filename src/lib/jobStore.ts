export interface JobConnection {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
  timeoutId: ReturnType<typeof setTimeout>;
  closing: boolean;
  closingBuffer: Array<{ progress: number; status: string; message: string }>;
  closingTimeoutId?: ReturnType<typeof setTimeout>;
}

// Module-level Map: persiste entre requests en el mismo proceso de Node.js.
// En prod con múltiples workers (pm2 cluster) se necesitaría Redis — no aplica aquí.
export const jobStore = new Map<string, JobConnection>();
