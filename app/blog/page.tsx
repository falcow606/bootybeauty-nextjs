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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">Le Blog</h1>

      {!items.length ? (
        <p className="opacity-70">Aucun article pour l’instant.</p>
      ) : (
        <div className="grid items-stretch gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const safeCover =
              typeof it.cover === "string" && /^https?:\/\//.test(it.cover) ? it.cover : undefined;

            return (
              <article
                key={it.slug}
                className="h-full flex flex-col overflow-hidden rounded-2xl border shadow-sm bg-white/60 backdrop-blur-sm transition hover:shadow-md"
              >
                {safeCover && (
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={safeCover}
                      alt={it.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold leading-tight">
                    <Link href={`/blog/${it.slug}`} className="hover:underline">
                      {it.title}
                    </Link>
                  </h2>

                  {it.excerpt && (
                    <p className="mt-2 text-sm opacity-80 min-h-[3.5rem]">
                      {it.excerpt}
                    </p>
                  )}

                  {/* Meta en bas pour uniformiser la hauteur */}
                  <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                    {it.date && (
                      <span className="text-xs opacity-70">{it.date}</span>
                    )}
                    {it.tags?.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] rounded-full border px-2 py-0.5 opacity-80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
