// app/api/offers/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;
};

const N8N_OFFERS_API = process.env.N8N_OFFERS_API; // ex: https://.../webhook/bootybeauty-offers-json
const N8N_OFFERS_KEY = process.env.N8N_OFFERS_KEY; // ex: bb_offers_...

export async function GET() {
  if (!N8N_OFFERS_API || !N8N_OFFERS_KEY) {
    return NextResponse.json({ ok: false, message: 'N8N envs missing' }, { status: 500 });
  }

  try {
    const res = await fetch(N8N_OFFERS_API + '?_t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'x-api-key': N8N_OFFERS_KEY,
        accept: 'application/json',
      },
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, snippet: text.slice(0, 200) },
        { status: 502 },
      );
    }

    let data: unknown = [];
    if (text) {
      try { data = JSON.parse(text); }
      catch {
        return NextResponse.json(
          { ok: false, message: 'Upstream non-JSON', snippet: text.slice(0, 200) },
          { status: 502 },
        );
      }
    }

    const list = Array.isArray(data) ? (data as Offer[]) : [];
    return NextResponse.json(list, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
