import { NextResponse } from 'next/server';
import https from 'node:https';
import type { VsphereInfrastructure } from '@/types/vmware';

// El servidor n8n interno tiene certificado SSL vencido — bypass scoped solo a esta ruta
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

function fetchJsonInsecure(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { agent: insecureAgent }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
          } catch (e) {
            reject(e);
          }
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

export async function GET() {
  const url = process.env.N8N_VSPHERE_URL;

  if (!url) {
    return NextResponse.json(
      { error: 'N8N_VSPHERE_URL is not configured' },
      { status: 500 },
    );
  }

  try {
    const data = (await fetchJsonInsecure(url)) as VsphereInfrastructure;
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
