import type { NextRequest } from 'next/server';
import https from 'node:https';
import http from 'node:http';
import { jobStore } from '@/lib/jobStore';
import type { JobConnection } from '@/lib/jobStore';
import type { VmCreationPayload } from '@/types/forms';

// TLS bypass — certificado vencido en el servidor n8n interno
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

const JOB_TIMEOUT_MS = 15 * 60 * 1000;

function sseChunk(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Dispara el POST a n8n sin leer su respuesta — los datos llegan vía callbacks.
// onError se llama si la conexión TCP falla antes de que n8n responda.
function triggerN8n(url: string, body: object, onError: (msg: string) => void): void {
  const bodyStr = JSON.stringify(body);
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';

  const options = {
    hostname: parsedUrl.hostname,
    port: Number(parsedUrl.port) || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(bodyStr)),
    },
    agent: isHttps ? insecureAgent : undefined,
  };

  const transport = isHttps ? https : http;

  const req = transport.request(options, (res) => {
    res.resume(); // drenar y descartar la respuesta de n8n
    res.on('error', () => {});
  });

  req.on('error', (err) => onError(`Error conectando con n8n: ${err.message}`));
  req.write(bodyStr);
  req.end();
}

export async function POST(request: NextRequest) {
  const n8nUrl = process.env.N8N_DEPLOY_URL;
  const callbackBase = process.env.APP_CALLBACK_URL;

  if (!n8nUrl) {
    console.error('[deploy] ✗ N8N_DEPLOY_URL no configurado en .env.local');
    return new Response(
      sseChunk({ status: 'error_proxy', message: 'N8N_DEPLOY_URL no configurado.', progress: 100 }),
      { headers: SSE_HEADERS },
    );
  }
  if (!callbackBase) {
    console.error('[deploy] ✗ APP_CALLBACK_URL no configurado en .env.local');
    return new Response(
      sseChunk({ status: 'error_proxy', message: 'APP_CALLBACK_URL no configurado.', progress: 100 }),
      { headers: SSE_HEADERS },
    );
  }

  const payload: VmCreationPayload = await request.json();
  const jobId = crypto.randomUUID();
  const callbackUrl = `${callbackBase}/api/deploy/callback`;
  const encoder = new TextEncoder();

  console.log(
    `[deploy] ▶ POST recibido — vm="${payload.vm_name}" host=${payload.host} template=${payload.template} network="${payload.network}" ip=${payload.ip || '(sin ip)'}`,
  );
  console.log(`[deploy] ▶ jobId=${jobId} registrado`);
  console.log(`[deploy] ▶ n8n URL  → ${n8nUrl}`);
  console.log(`[deploy] ▶ callback → ${callbackUrl}?jobId=${jobId}`);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const timeoutId = setTimeout(() => {
        if (!jobStore.has(jobId)) return;
        console.warn(`[deploy] ✗ TIMEOUT jobId=${jobId} — 15min sin respuesta de n8n`);
        controller.enqueue(
          encoder.encode(
            sseChunk({
              status: 'error_timeout',
              message: 'Timeout: n8n no respondió en 15 minutos.',
              progress: 100,
            }),
          ),
        );
        try { controller.close(); } catch { /* ya cerrado */ }
        jobStore.delete(jobId);
      }, JOB_TIMEOUT_MS);

      const job: JobConnection = {
        controller,
        encoder,
        timeoutId,
        closing: false,
        closingBuffer: [],
      };
      jobStore.set(jobId, job);

      // triggerN8n DENTRO de start() — garantiza que el jobId ya está en el store
      // cuando n8n recibe el request y manda el primer callback.
      triggerN8n(
        n8nUrl,
        { ...payload, jobId, callbackUrl },
        (errMsg) => {
          console.error(`[deploy] ✗ ERROR n8n jobId=${jobId} — ${errMsg}`);
          const failedJob = jobStore.get(jobId);
          if (!failedJob) return;
          failedJob.controller.enqueue(
            failedJob.encoder.encode(sseChunk({ status: 'error_proxy', message: errMsg, progress: 100 })),
          );
          try { failedJob.controller.close(); } catch { /* ya cerrado */ }
          clearTimeout(failedJob.timeoutId);
          jobStore.delete(jobId);
        },
      );

      console.log(`[deploy] ▶ trigger enviado a n8n — esperando callbacks para jobId=${jobId}`);
    },
    cancel() {
      console.log(`[deploy] ✗ stream cancelado por el cliente — jobId=${jobId}`);
      const job = jobStore.get(jobId);
      if (job) {
        clearTimeout(job.timeoutId);
        if (job.closingTimeoutId) clearTimeout(job.closingTimeoutId);
      }
      jobStore.delete(jobId);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
