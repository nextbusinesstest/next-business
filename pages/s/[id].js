import Head from "next/head";
import PacksRouter from "../../components/preview/PacksRouter";
import { v1ToV2 } from "../../lib/spec/adapters/v1_to_v2";
import { normalizeV2 } from "../../lib/spec/v2/normalize";
import { resolveV2Layout } from "../../lib/spec/v2/resolveLayout";

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

  const title = spec?.seo?.title || spec?.meta?.title || spec?.business?.name || "Site";
  const favicon = spec?.brand?.logoDataUrl ? spec.brand.logoDataUrl : "/logo.png";

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
  const { id } = ctx.params;

  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `http://${ctx.req.headers.host}`;

  try {
    const r = await fetch(`${base}/api/sites/${encodeURIComponent(id)}`);
    if (!r.ok) return { props: { spec: null } };

    let spec = await r.json();

    if (!spec?.version || spec.version === "v1") spec = v1ToV2(spec);
    spec = normalizeV2(spec);
    spec = resolveV2Layout(spec);

    return { props: { spec } };
  } catch {
    return { props: { spec: null } };
  }
}
