import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/clientes-f")({
  component: ClientesFPage,
  head: () => ({ meta: [{ title: "Clientes — NaraGest" }] }),
});

function ClientesFPage() {
  return (
    <ModulePage
      title="Clientes"
      subtitle="Fichas, fidelización e historial de mostrador (sin datos clínicos sensibles)"
      icon={Users}
      primaryAction={{ label: "Nuevo cliente" }}
      filters={["Todos", "Fidelizados", "SPD", "Activos"]}
      stats={[
        { label: "Clientes", value: "326" },
        { label: "Fidelizados", value: "118" },
        { label: "SPD", value: "24" },
        { label: "Altas mes", value: "7" },
      ]}
      columns={[
        { key: "codigo", label: "Código" },
        { key: "nombre", label: "Nombre" },
        { key: "telefono", label: "Teléfono" },
        { key: "programa", label: "Programa" },
        { key: "ultima", label: "Última visita" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", codigo: "C-1001", nombre: "María López", telefono: "600 111 222", programa: "Fidelización", ultima: "05/11/2026", estado: "Activo" },
        { id: "2", codigo: "C-1002", nombre: "Juan Pérez", telefono: "600 333 444", programa: "SPD", ultima: "04/11/2026", estado: "Activo" },
        { id: "3", codigo: "C-1003", nombre: "Carmen Ruiz", telefono: "600 555 666", programa: "—", ultima: "01/11/2026", estado: "Activo" },
      ]}
    />
  );
}
