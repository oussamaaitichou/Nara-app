import { createFileRoute } from "@tanstack/react-router";
import { UserCircle2 } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/equipo")({
  component: EquipoPage,
  head: () => ({ meta: [{ title: "Equipo y turnos — NaraGest" }] }),
});

function EquipoPage() {
  return (
    <ModulePage
      title="Equipo y turnos"
      subtitle="Personal, roles, fichaje y cuadrante"
      icon={UserCircle2}
      primaryAction={{ label: "Añadir persona" }}
      filters={["Todos", "En turno", "Titulares", "Técnicos", "Auxiliares"]}
      stats={[
        { label: "Plantilla", value: "6" },
        { label: "En turno", value: "3" },
        { label: "Vacaciones", value: "1" },
        { label: "Guardias mes", value: "2" },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "rol", label: "Rol" },
        { key: "turno", label: "Turno" },
        { key: "entrada", label: "Entrada" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", nombre: "Ana Gómez", rol: "Titular", turno: "Mañana", entrada: "09:00", estado: "En turno" },
        { id: "2", nombre: "Luis Martín", rol: "Adjunto", turno: "Mañana", entrada: "09:05", estado: "En turno" },
        { id: "3", nombre: "Sara Díaz", rol: "Técnico", turno: "Tarde", entrada: "—", estado: "Pendiente" },
        { id: "4", nombre: "Pablo Ruiz", rol: "Auxiliar", turno: "Mañana", entrada: "09:12", estado: "En turno" },
      ]}
    />
  );
}
