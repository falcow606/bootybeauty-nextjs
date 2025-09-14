// app/api/blog/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const N8N_BLOG_URL = process.env.N8N_BLOG_URL!
const N8N_BLOG_KEY = process.env.N8N_BLOG_KEY!

type BlogPost = {
  slug: string
  title: string
  hero: string | null
  excerpt: string | null
  html: string | null
  date: string | null
}

export async function GET() {
  if (!N8N_BLOG_URL || !N8N_BLOG_KEY) {
    return NextResponse.json({ ok: false, error: 'blog_env_missing' }, { status: 500 })
  }

  try {
    const res = await fetch(N8N_BLOG_URL + '?_t=' + Date.now(), {
      headers: { 'x-api-key': N8N_BLOG_KEY, accept: 'application/json' },
      cache: 'no-store',
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, snippet: text.slice(0, 200) },
        { status: 502 },
      )
    }

    let data: unknown = []
    try { data = text ? JSON.parse(text) : [] } catch {
      return NextResponse.json({ ok: false, error: 'blog_non_json', snippet: text.slice(0,200) }, { status: 502 })
    }

    const list = Array.isArray(data) ? (data as BlogPost[]) : []
    return NextResponse.json(list, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, error: 'blog_fetch_failed' }, { status: 502 })
  }
}
