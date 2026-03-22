import fs from "fs";
import path from "path";
import Head from "next/head";
import PacksRouter from "../../components/preview/PacksRouter";
import { v1ToV2 } from "../../lib/spec/adapters/v1_to_v2";
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

const IS_PROD = (process.env.NODE_ENV || "development") === "production";

function sanitizeId(id) {
  return (id ?? "").toString().trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function getFsDir() {
  return path.join(process.cwd(), "data", "sites");
}

// ---------------- KV helpers ----------------
function getKvConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("KV not configured (missing KV_REST_API_URL / KV_REST_API_TOKEN).");
  }
  return { url, token };
}

async function kvGet(key) {
  const { url, token } = getKvConfig();
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!r.ok) {
    throw new Error(`KV get failed (${r.status})`);
  }

  const data = await r.json().catch(() => null);
  return data?.result ?? null;
}

async function loadRawSpecById(id) {
  if (IS_PROD) {
    return await kvGet(`nb:site:${id}`);
  }

  const file = path.join(getFsDir(), `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

export default function PublicSite({ spec }) {
  if (!spec) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 text-center">
          <div className="text-lg font-semibold">Site no encontrado</div>
          <div className="text-sm text-neutral-600 mt-2">
            El site_id no existe o no está publicado.
          </div>
        </div>
      </div>
    );
  }

  const title =
    spec?.seo?.title ||
    spec?.meta?.title ||
    spec?.business?.name ||
    "Site";

  const favicon = spec?.brand?.logoDataUrl
    ? spec.brand.logoDataUrl
    : "/logo.png";

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" type="image/png" href={favicon} />
      </Head>

      <div className="nb-root min-h-screen">
        <PacksRouter spec={spec} />
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const id = sanitizeId(ctx?.params?.id);

  if (!id) {
    return { props: { spec: null } };
  }

  try {
    const raw = await loadRawSpecById(id);
    if (!raw) {
      return { props: { spec: null } };
    }

    let spec = JSON.parse(raw);

    if (!spec?.version || spec.version === "v1") {
      spec = v1ToV2(spec);
    }

    spec = normalizeV2(spec);
    spec = resolveV2Layout(spec);

    return {
      props: { spec },
    };
  } catch (e) {
    console.error("Error loading public site:", e);
    return { props: { spec: null } };
  }
}
