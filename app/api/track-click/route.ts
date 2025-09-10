// app/api/track-click/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ClickPayload = {
  href: string;
  merchant: string | null;
  slug: string;
  pos: number;
  pathname: string | null;
  referrer: string | null;
};

const N8N_CLICK_WEBHOOK = process.env.N8N_CLICK_WEBHOOK; // ex: https://.../webhook/bootybeauty-clicks
const N8N_CLICK_SECRET  = process.env.N8N_CLICK_SECRET;  // ta clé secrète (vérifiée dans l’IF côté n8n)

export async function POST(req: NextRequest) {
  if (!N8N_CLICK_WEBHOOK || !N8N_CLICK_SECRET) {
    return NextResponse.json({ ok: false, message: 'missing n8n envs' }, { status: 500 });
    }

  let bodyUnknown: unknown;
  try { bodyUnknown = await req.json(); }
  catch { return NextResponse.json({ ok: false, message: 'invalid json' }, { status: 400 }); }

  const b = bodyUnknown as Partial<ClickPayload>;
  if (!b?.href || typeof b.href !== 'string') {
    return NextResponse.json({ ok: false, message: 'missing href' }, { status: 400 });
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

  // proxy vers n8n + secret
  fetch(N8N_CLICK_WEBHOOK, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-token': N8N_CLICK_SECRET, // ton IF côté n8n lit ce header
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => { /* on ne bloque pas la réponse site */ });

  return new NextResponse(null, { status: 204 });
}
