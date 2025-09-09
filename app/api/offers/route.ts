// app/api/offers/route.ts
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

export async function GET() {
  const url = process.env.N8N_OFFERS_API;
  if (!url) {
    return Response.json({ ok: false, message: 'N8N_OFFERS_API missing' }, { status: 500 });
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        { ok: false, status: res.status, snippet: text.slice(0, 200) },
        { status: 502 },
      );
    }

    let data: unknown = [];
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        return Response.json(
          { ok: false, message: 'Upstream returned non-JSON', snippet: text.slice(0, 200) },
          { status: 502 },
        );
      }
    }

    const list = Array.isArray(data) ? (data as Offer[]) : [];
    return Response.json(list, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return Response.json({ ok: false, message }, { status: 500 });
  }
}

