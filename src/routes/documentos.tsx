import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/documentos")({
  component: DocumentosPage,
  head: () => ({ meta: [{ title: "Documentación — NaraGest" }] }),
});

function DocumentosPage() {
  return (
    <ModulePage
      title="Documentación"
      subtitle="Protocolos, inspecciones, contratos y certificados"
      icon={FileText}
      primaryAction={{ label: "Subir documento" }}
      filters={["Todos", "Inspección", "Protocolos", "Contratos", "Formación"]}
      stats={[
        { label: "Documentos", value: "48" },
        { label: "Pendientes revisión", value: "3" },
        { label: "Caducan pronto", value: "2" },
        { label: "Este mes", value: "5" },
      ]}
      columns={[
        { key: "nombre", label: "Documento" },
        { key: "categoria", label: "Categoría" },
        { key: "fecha", label: "Fecha" },
        { key: "vence", label: "Vence" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", nombre: "POE temperaturas", categoria: "Protocolo", fecha: "01/09/2026", vence: "01/09/2027", estado: "Vigente" },
        { id: "2", nombre: "Acta inspección 2025", categoria: "Inspección", fecha: "12/03/2025", vence: "—", estado: "Archivado" },
        { id: "3", nombre: "Contrato COFARES", categoria: "Contrato", fecha: "15/01/2026", vence: "15/01/2027", estado: "Vigente" },
      ]}
    />
  );
}
