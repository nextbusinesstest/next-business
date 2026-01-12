import { useState } from "react";
import NBButton from "../shared/NBButton";

export default function ContactSection({ spec, body }) {
  const [sent, setSent] = useState(false);

  const email = spec?.contact?.email;
  const phone = spec?.contact?.phone;
  const address = spec?.contact?.address;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6">
        <div className="text-sm text-black/70">{body || "Cuéntanos qué necesitas y te respondemos lo antes posible."}</div>

        <div className="mt-5 space-y-2 text-sm text-black/75">
          {phone ? <div><span className="font-semibold">Teléfono:</span> {phone}</div> : null}
          {email ? <div><span className="font-semibold">Email:</span> {email}</div> : null}
          {address ? <div><span className="font-semibold">Ubicación/Zona:</span> {address}</div> : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {phone ? <NBButton variant="ghost" href={`tel:${phone}`}>Llamar</NBButton> : null}
          {email ? <NBButton variant="ghost" href={`mailto:${email}`}>Enviar email</NBButton> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            e.currentTarget.reset();
          }}
          className="grid gap-3"
        >
          <label className="text-xs font-semibold text-black/60">Nombre</label>
          <input required className="p-3 border rounded-xl" placeholder="Tu nombre" />

          <label className="text-xs font-semibold text-black/60">Email</label>
          <input required type="email" className="p-3 border rounded-xl" placeholder="tu@email.com" />

          <label className="text-xs font-semibold text-black/60">Mensaje</label>
          <textarea required rows={4} className="p-3 border rounded-xl" placeholder="Cuéntanos tu necesidad…" />

          <div className="pt-2">
            <NBButton>Enviar solicitud</NBButton>
          </div>

          {sent ? (
            <div className="text-sm text-green-700 mt-2">
              En preview: solicitud enviada (simulada). En producción irá a tu endpoint real.
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
