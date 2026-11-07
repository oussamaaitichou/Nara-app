import { useState } from "react";
import { Button } from "@/components/ui/button";

export type NaraSolicitudUI = {
  id: number;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  entidad: string;
  tipo_entidad: string;
  plan_interes: string | null;
  mensaje: string | null;
  estado: string;
};

type Accion = (body: Record<string, unknown>, okMsg?: string) => Promise<Record<string, unknown> | null>;

const campo =
  "h-9 rounded-md border border-line bg-bg px-2 text-sm text-ink outline-none focus:border-teal";

const fecha = (iso: string) => new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });

export function NaraSolicitudesPanel({
  items,
  pendientes,
  accion,
}: {
  items: NaraSolicitudUI[];
  pendientes: number;
  accion: Accion;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-ink">
        Solicitudes de demo / plan{" "}
        {pendientes > 0 ? (
          <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-sm text-warn">{pendientes} pendientes</span>
        ) : null}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">No hay solicitudes de demo pendientes.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <NaraSolicitudItem key={s.id} s={s} accion={accion} />
          ))}
        </ul>
      )}
    </section>
  );
}

function NaraSolicitudItem({ s, accion }: { s: NaraSolicitudUI; accion: Accion }) {
  const [planId, setPlanId] = useState(s.plan_interes || "demo");
  const [dias, setDias] = useState("7");
  const [resultado, setResultado] = useState<string | null>(null);

  return (
    <li className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div>
        <p className="font-medium text-ink">
          {s.nombre} <span className="text-xs font-normal text-muted">· {fecha(s.created_at)}</span>
        </p>
        <p className="text-sm text-ink-soft">
          {s.email}
          {s.telefono ? ` · ${s.telefono}` : ""}
        </p>
        <p className="text-sm text-muted">
          {s.tipo_entidad}: <strong>{s.entidad}</strong>
          {s.plan_interes ? ` · interés: ${s.plan_interes}` : ""}
        </p>
        {s.mensaje ? <p className="mt-1 text-sm text-ink-soft">{s.mensaje}</p> : null}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs text-ink-soft">
          <span>Plan</span>
          <select className={`${campo} block`} value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="demo">Demo</option>
            <option value="gratis">Gratis</option>
            <option value="premium">Premium</option>
            <option value="medida">A medida</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-ink-soft">
          <span>Días</span>
          <input className={`${campo} block w-20`} type="number" min={1} max={365} value={dias} onChange={(e) => setDias(e.target.value)} />
        </label>
        <Button
          size="sm"
          onClick={async () => {
            const r = await accion(
              { accion: "nara_aprobar", id: s.id, planId, dias: Number(dias) },
              "Solicitud aprobada.",
            );
            if (r?.invitacionEnviada) setResultado("Invitación enviada por correo.");
            else if (r?.invitacionToken)
              setResultado(`Correo no enviado. Enlace: /invitar/${r.invitacionToken as string}`);
            else if (r?.passwordTemporalFallback)
              setResultado(`Contraseña temporal: ${r.passwordTemporalFallback as string}`);
          }}
        >
          Aprobar y crear acceso
        </Button>
        <Button size="sm" variant="outline" onClick={() => void accion({ accion: "nara_rechazar", id: s.id }, "Rechazada.")}>
          Rechazar
        </Button>
      </div>
      {resultado ? <p className="text-xs text-teal-deep">{resultado}</p> : null}
    </li>
  );
}
