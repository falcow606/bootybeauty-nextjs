// app/api/track-click/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // pas de cache

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.href) {
      return NextResponse.json({ ok: false, message: 'missing href' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const ua = req.headers.get('user-agent') ?? null
    const webhook = process.env.N8N_CLICK_WEBHOOK
    if (!webhook) {
      return NextResponse.json({ ok: false, message: 'N8N_CLICK_WEBHOOK missing' }, { status: 500 })
    }

    const payload = {
      ...body,            // href, merchant, slug, pos, pathname, referrer
      ip,
      ua,
      timestamp: new Date().toISOString(),
    }

    // Relais serveur -> n8n (pas de CORS côté navigateur)
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // un webhook peut répondre lentement → on n'attend pas la réponse pour rendre 204
      keepalive: true,
    }).catch(() => {})

    // Répond vite au client pour ne pas bloquer la navigation
    return new Response(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || 'error' }, { status: 500 })
  }
}
