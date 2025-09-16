export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type UnknownRecord = Record<string, unknown>;

type BlogPost = {
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  dateISO?: string;
  tags?: string[];
  published?: boolean;
};

export const revalidate = 0;

/* ---------- utils ---------- */
function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui","yes","true","1","y","ok","published"].includes(s);
}
function normStr(v: unknown): string { return v == null ? "" : typeof v === "string" ? v : String(v); }

/** Renvoie la première valeur existante pour les clés données (sans `any`). */
function getVal(obj: UnknownRecord, keys: string[]): unknown {
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(rec, k)) return rec[k];
  }
  return undefined;
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  const v = getVal(obj, keys);
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}
function slugify(input: string): string {
  const s = input.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  return s || "article";
}

/** Cherche un tableau “logique” dans un JSON (sans `any`). */
function firstArray(json: unknown): UnknownRecord[] {
  if (Array.isArray(json)) return json as UnknownRecord[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    const keys = ["items","data","result","rows","records","list","values","results"];
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) return v as UnknownRecord[];
    }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (v && typeof v === "object") {
        const sub = v as Record<string, unknown>;
        for (const k of keys) {
          const vv = sub[k];
          if (Array.isArray(vv)) return vv as UnknownRecord[];
        }
      }
    }
  }
  return [];
}
function guessDelimiter(header: string): "," | ";" {
  let inQ=false,c=0,s=0;
  for (let i=0;i<header.length;i++){
    const ch=header[i];
    if(ch==='"'){ if(inQ && header[i+1]==='"'){i++;continue;} inQ=!inQ; continue; }
    if(!inQ){ if(ch===',') c++; else if(ch===';') s++; }
  }
  return s>c?";":",";
}
function parseCSV(text: string): UnknownRecord[] {
  try {
    if (!text.trim()) return [];
    const firstNL = text.indexOf("\n") === -1 ? text.length : text.indexOf("\n");
    const delim = guessDelimiter(text.slice(0, firstNL));
    const rows:string[][]=[], clean=(s:string)=>s.replace(/^\uFEFF/,"").replace(/\u00A0/g," ").replace(/\s+/g," ").trim();
    let row:string[]=[]; let field=""; let inQ=false;
    const pushField=():void=>{ row.push(field); field=""; };
    const pushRow=():void=>{
      if(row.length>1||(row.length===1&&row[0].trim()!=="")) rows.push(row);
      row=[];
    };
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){ if(inQ && text[i+1]==='"'){ field+='"'; i++; } else inQ=!inQ; continue; }
      if(!inQ && (ch===delim)){ pushField(); continue; }
      if(!inQ && (ch==="\n"||ch==="\r")){ if(ch==="\r"&&text[i+1]==="\n") i++; pushField(); pushRow(); continue; }
      field+=ch;
    }
    pushField(); pushRow();
    if(!rows.length) return [];
    const headers=rows[0].map(clean); const out:UnknownRecord[]=[];
    for(let r=1;r<rows.length;r++){
      const rec:UnknownRecord={}; const cols=rows[r];
      headers.forEach((h,idx)=>{ rec[h]=(cols[idx]??"").replace(/\r$/,""); });
      out.push(rec);
    }
    return out;
  } catch {
    return [];
  }
}
function splitTags(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[,|]/g).map(t=>t.trim()).filter(Boolean);
}
function mapPost(row: UnknownRecord): BlogPost | null {
  const slug = getStr(row, ["Slug","slug"]) || (getStr(row,["Title","Titre"]) ? slugify(getStr(row,["Title","Titre"])!) : undefined);
  if (!slug) return null;
  const title = getStr(row, ["Title","Titre","H1"]) || "Article";
  const excerpt = getStr(row, ["Excerpt","Résumé","Chapo","Intro"]) || undefined;
  const cover = getStr(row, ["Cover","Image","Cover_URL","Cover URL","Image_URL","Hero"]) || undefined;
  const dateISO = getStr(row, ["Date","PublishedAt","UpdatedAt","createdAt"]) || undefined;
  const tags = splitTags(getStr(row, ["Tags","Mots-clés","Keywords"]));
  const published = truthy(getVal(row, ["Published","Publi","En ligne","Online"]));
  return { slug, title, excerpt, cover, dateISO, tags, published };
}

/* ---------- fetch ---------- */
const baseInit: RequestInit & { next?: { revalidate?: number } } =
  process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
    ? { cache: "no-store" } : { next: { revalidate: 1800 } };

async function fetchRows(url?: string, needsKey = true): Promise<UnknownRecord[]> {
  if (!url) return [];
  try {
    const init: RequestInit & { next?: { revalidate?: number } } = { ...baseInit };
    if (needsKey && process.env.N8N_OFFERS_KEY) {
      init.headers = { "x-api-key": String(process.env.N8N_OFFERS_KEY) };
    }
    const res = await fetch(url, init);
    if (!res.ok) return [];
    const ct = normStr(res.headers.get("content-type")).toLowerCase();
    if (ct.includes("application/json") || ct.includes("text/json")) {
      const j = await res.json().catch<unknown>(()=>null);
      return j ? firstArray(j) : [];
    }
    const text = await res.text();
    const tt = text.trim();
    if (tt.startsWith("{") || tt.startsWith("[")) {
      try { return firstArray(JSON.parse(tt) as unknown); } catch { /* continue to CSV */ }
    }
    return parseCSV(text);
  } catch {
    return [];
  }
}
async function getAllPosts(): Promise<BlogPost[]> {
  const sources = [
    { url: process.env.N8N_BLOG_URL, needsKey: true },
    { url: process.env.SHEETS_BLOG_CSV, needsKey: false },
  ].filter(s=>!!s.url) as { url:string; needsKey:boolean }[];

  for (const s of sources) {
    const rows = await fetchRows(s.url, s.needsKey);
    if (rows.length) {
      const mapped = rows.map(mapPost).filter((x): x is BlogPost => x !== null);
      if (mapped.length) return mapped;
    }
  }
  return [];
}
function fmtDateFr(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString("fr-FR");
  }
}

/* ---------- Page ---------- */
export default async function BlogIndex() {
  const sourceSet = !!(process.env.N8N_BLOG_URL || process.env.SHEETS_BLOG_CSV);
  const posts = (await getAllPosts())
    .filter(p => p.published !== false)
    .sort((a, b) => (new Date(b.dateISO ?? 0).getTime()) - (new Date(a.dateISO ?? 0).getTime()));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "var(--text)" }}>Le blog</h1>
        <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "var(--text)" }}>
          Guides booty, soins intimes, sélections & bons plans beauté.
        </p>
      </header>

      {!sourceSet ? (
        <div className={`${nunito.className} rounded-3xl border p-5`} style={{ borderColor: "var(--bg-light)" }}>
          <strong>Configuration requise :</strong> définis <code>SHEETS_BLOG_CSV</code> ou <code>N8N_BLOG_URL</code> dans Vercel.
        </div>
      ) : posts.length === 0 ? (
        <p className={`${nunito.className} opacity-70`}>Aucun article pour l’instant.</p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article key={p.slug} className="flex flex-col rounded-3xl bg-white shadow-md ring-1 transition hover:shadow-lg" style={{ borderColor: "var(--bg-light)" }}>
              <div className="relative overflow-hidden rounded-t-3xl">
                <Image
                  src={p.cover || "/images/blog-placeholder.jpg"}
                  alt={p.title}
                  width={900}
                  height={600}
                  unoptimized
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold" style={{ color: "var(--accent)" }}>{p.title}</h3>
                {p.dateISO ? (
                  <div className={`${nunito.className} mt-1 text-xs opacity-60`} style={{ color: "var(--text)" }}>
                    {fmtDateFr(p.dateISO)}
                  </div>
                ) : null}
                {p.excerpt ? (
                  <p className={`${nunito.className} mt-2 text-sm opacity-90`} style={{ color: "var(--text)" }}>
                    {p.excerpt}
                  </p>
                ) : null}
                {p.tags && p.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.tags.map((t, i) => (
                      <span key={i} className={`${nunito.className} inline-block rounded-full border px-2 py-0.5 text-xs opacity-80`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="inline-block rounded-2xl px-4 py-2 text-sm text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Lire l’article
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
