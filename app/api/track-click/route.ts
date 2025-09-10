// app/api/track-click/route.ts
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type ClickPayload = {
  href: string;
  merchant: string | null;
  slug: string;
  pos: number;
  pathname: string | null;
  referrer: string | null;
};

export async function POST(req: NextRequest) {
  const webhook = process.env.N8N_CLICK_WEBHOOK;
  const secret = process.env.N8N_CLICK_SECRET;

  if (!webhook || !secret) {
    return Response.json({ ok: false, message: 'missing n8n envs' }, { status: 500 });
  }

  let bodyUnknown: unknown;
  try { bodyUnknown = await req.json(); }
  catch { return Response.json({ ok: false, message: 'invalid json' }, { status: 400 }); }

  const b = bodyUnknown as Partial<ClickPayload>;
  if (!b?.href || typeof b.href !== 'string') {
    return Response.json({ ok: false, message: 'missing href' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ?? null;
  const ua = req.headers.get('user-agent') ?? null;

  const payload = {
    href: b.href,
    merchant: b.merchant ?? null,
    slug: b.slug ? String(b.slug) : '',
    pos: typeof b.pos === 'number' ? b.pos : 0,
    pathname: b.pathname ?? null,
    referrer: b.referrer ?? null,
    ip,
    ua,
    timestamp: new Date().toISOString(),
  };

  // Envoi au webhook n8n avec le secret en header
  fetch(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Token': secret, // vérifié côté n8n
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});

  return new Response(null, { status: 204 });
}

