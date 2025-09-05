import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// On force cette route à être dynamique (pas de cache sur l'API)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const secret = searchParams.get('secret')
  const tag = searchParams.get('tag')      // ex: 'content' | 'offers'
  const path = searchParams.get('path')    // ex: '/', '/top-10/booty-beauty-2025'

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
  }

  if (!tag && !path) {
    return NextResponse.json({ ok: false, message: 'Missing tag or path' }, { status: 400 })
  }

  try {
    if (tag) revalidateTag(tag)
    if (path) revalidatePath(path)
    return NextResponse.json({ ok: true, revalidated: { tag, path } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || 'Error' }, { status: 500 })
  }
}
