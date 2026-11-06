import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/tareas")({
  component: TareasPage,
  head: () => ({ meta: [{ title: "Tareas — NaraGest" }] }),
});

function TareasPage() {
  return (
    <ModulePage
      title="Tareas"
      subtitle="Productividad del equipo por turno y farmacia"
      icon={ClipboardList}
      primaryAction={{ label: "Nueva tarea" }}
      filters={["Todas", "Urgentes", "Hoy", "Bloqueadas", "Completadas"]}
      stats={[
        { label: "Pendientes", value: "5" },
        { label: "Urgentes", value: "1" },
        { label: "Hoy", value: "3" },
        { label: "Completadas", value: "12" },
      ]}
      columns={[
        { key: "titulo", label: "Tarea" },
        { key: "responsable", label: "Responsable" },
        { key: "prioridad", label: "Prioridad" },
        { key: "limite", label: "Límite" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", titulo: "Revisar caducidades góndola A", responsable: "Sara", prioridad: "Urgente", limite: "Hoy", estado: "Pendiente" },
        { id: "2", titulo: "Arqueo de caja turno mañana", responsable: "Ana", prioridad: "Alta", limite: "Hoy", estado: "En curso" },
        { id: "3", titulo: "Confirmar pedido COFARES", responsable: "Luis", prioridad: "Media", limite: "Hoy", estado: "Pendiente" },
        { id: "4", titulo: "Actualizar cartel de guardias", responsable: "Pablo", prioridad: "Baja", limite: "08/11", estado: "Pendiente" },
        { id: "5", titulo: "Temperatura nevera 2", responsable: "Sara", prioridad: "Alta", limite: "Hoy", estado: "Pendiente" },
      ]}
    />
  );
}
