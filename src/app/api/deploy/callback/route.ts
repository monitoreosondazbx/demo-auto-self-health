import type { NextRequest } from 'next/server';
import { jobStore } from '@/lib/jobStore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

// Tiempo que esperamos callbacks concurrentes después de recibir el terminal.
// n8n puede enviar fases casi simultáneamente — esta ventana las captura y ordena.
const CLOSING_GRACE_MS = 2500;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')?.trim() ?? null;

  if (!jobId) {
    return new Response('Missing jobId', { status: 400, headers: CORS_HEADERS });
  }

  const job = jobStore.get(jobId);
  if (!job) {
    console.warn(`[callback] ! jobId=${jobId} NOT FOUND — job ya completado, cancelado o expirado`);
    return new Response('Job not found or already completed', { status: 404, headers: CORS_HEADERS });
  }

  const raw = (await request.json()) as { progress: unknown; status: unknown; message: unknown };

  const progress = Number(raw.progress);
  const status = String(raw.status ?? '');
  const message = String(raw.message ?? '');

  if (isNaN(progress)) {
    console.error(`[callback] ✗ progress inválido para jobId=${jobId} — raw.progress=${String(raw.progress)}`);
    return new Response('Invalid progress value', { status: 400, headers: CORS_HEADERS });
  }

  const isError = status.startsWith('error_');
  const isTerminal = progress >= 100 || isError;
  const icon = isError ? '✗' : isTerminal ? '✓' : '↓';
  console.log(`[callback] ${icon} jobId=${jobId}  ${String(progress).padStart(3)}%  ${status}`);

  // Si ya estamos en la ventana de cierre, acumulamos en el buffer para el flush final.
  if (job.closing) {
    job.closingBuffer.push({ progress, status, message });
    console.log(`[callback] ⏳ buffered late chunk — progress=${progress}% (grace window activa)`);
    return new Response('OK', { status: 200, headers: CORS_HEADERS });
  }

  // Callbacks no-terminales: entrega en tiempo real.
  if (!isTerminal) {
    job.controller.enqueue(
      job.encoder.encode(`data: ${JSON.stringify({ progress, status, message })}\n\n`),
    );
    return new Response('OK', { status: 200, headers: CORS_HEADERS });
  }

  // ── Callback terminal ──────────────────────────────────────────────────────
  // No cerramos inmediatamente. Iniciamos una ventana de 2.5s para capturar
  // callbacks concurrentes de n8n (p.ej. progress=90 llegando 18ms después de 100).
  job.closing = true;
  job.closingBuffer.push({ progress, status, message });
  clearTimeout(job.timeoutId);

  if (isError) {
    console.error(`[callback] ✗ ERROR — mensaje: ${message}`);
  } else {
    console.log(`[callback] ✓ terminal recibido — jobId=${jobId} cerrará en ${CLOSING_GRACE_MS}ms`);
  }

  job.closingTimeoutId = setTimeout(() => {
    const j = jobStore.get(jobId);
    if (!j) return; // ya limpiado por cancel()

    // Ordenar por progreso para garantizar la secuencia correcta de animación.
    const sorted = [...j.closingBuffer].sort((a, b) => a.progress - b.progress);
    console.log(
      `[callback] ⏲ flush jobId=${jobId} — ${sorted.length} chunks: ${sorted.map((c) => `${c.progress}%`).join(' → ')}`,
    );

    for (const item of sorted) {
      try {
        j.controller.enqueue(j.encoder.encode(`data: ${JSON.stringify(item)}\n\n`));
      } catch {
        break; // stream ya cerrado
      }
    }

    try { j.controller.close(); } catch { /* ya cerrado */ }
    jobStore.delete(jobId);
  }, CLOSING_GRACE_MS);

  return new Response('OK', { status: 200, headers: CORS_HEADERS });
}
