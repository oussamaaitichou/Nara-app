import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/caducidades")({
  component: CaducidadesPage,
  head: () => ({ meta: [{ title: "Caducidades — NaraGest" }] }),
});

function CaducidadesPage() {
  return (
    <ModulePage
      title="Caducidades"
      subtitle="Control de lotes próximos a caducar y retiradas"
      icon={AlertTriangle}
      primaryAction={{ label: "Registrar retirada" }}
      filters={["90 días", "60 días", "30 días", "Caducados", "Nevera"]}
      stats={[
        { label: "En 30 días", value: "4" },
        { label: "En 60 días", value: "7" },
        { label: "En 90 días", value: "12" },
        { label: "Caducados", value: "1" },
      ]}
      columns={[
        { key: "producto", label: "Producto" },
        { key: "lote", label: "Lote" },
        { key: "caducidad", label: "Caducidad" },
        { key: "unidades", label: "Ud." },
        { key: "ubicacion", label: "Ubicación" },
        { key: "prioridad", label: "Prioridad" },
      ]}
      rows={[
        { id: "1", producto: "Amoxicilina 500 mg", lote: "L08C", caducidad: "15/11/2026", unidades: 5, ubicacion: "Recetas", prioridad: "Alta" },
        { id: "2", producto: "Insulina glargina", lote: "N02", caducidad: "28/11/2026", unidades: 4, ubicacion: "Nevera 1", prioridad: "Alta" },
        { id: "3", producto: "Ibuprofeno 600 mg", lote: "L19B", caducidad: "10/12/2026", unidades: 8, ubicacion: "Góndola A", prioridad: "Media" },
        { id: "4", producto: "Colirio artificial", lote: "C11", caducidad: "02/01/2027", unidades: 14, ubicacion: "Góndola C", prioridad: "Baja" },
      ]}
    />
  );
}
