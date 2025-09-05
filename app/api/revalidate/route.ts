import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const secret = searchParams.get('secret')
  const tag = searchParams.get('tag')
  const path = searchParams.get('path')

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
