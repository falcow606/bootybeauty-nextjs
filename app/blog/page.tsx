// app/blog/page.tsx
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Item = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
};

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (host) return `https://${host.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

async function fetchList(): Promise<Item[]> {
  const res = await fetch(`${getBaseUrl()}/api/blog`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function BlogIndex() {
  const items = await fetchList();

  if (!items.length) {
    return (
      <main className="prose mx-auto p-6">
        <h1>Le Blog</h1>
        <p>Aucun article pour l’instant.</p>
      </main>
    );
  }

  return (
    <main className="prose mx-auto p-6">
      <h1>Le Blog</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((it) => {
          const safeCover = typeof it.cover === "string" && /^https?:\/\//.test(it.cover) ? it.cover : undefined;
          return (
            <article key={it.slug} className="border rounded-xl p-4">
              {safeCover && (
                <div className="relative w-full aspect-[16/9] mb-3">
                  <Image
                    src={safeCover}
                    alt={it.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="!mt-0">
                <Link href={`/blog/${it.slug}`}>{it.title}</Link>
              </h2>
              {it.excerpt && <p>{it.excerpt}</p>}
              {it.date && <p><small>{it.date}</small></p>}
            </article>
          );
        })}
      </div>
    </main>
  );
}
