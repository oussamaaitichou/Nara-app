import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ModulePage } from "@/components/erp/module-page";

export const Route = createFileRoute("/configuracion")({
  component: ConfiguracionPage,
  head: () => ({ meta: [{ title: "Configuración — NaraGest" }] }),
});

function ConfiguracionPage() {
  return (
    <ModulePage
      title="Configuración"
      subtitle="Usuarios, permisos, farmacia e integraciones"
      icon={Settings}
      primaryAction={{ label: "Guardar cambios" }}
      filters={["General", "Usuarios", "Permisos", "Integraciones"]}
      stats={[
        { label: "Usuarios", value: "6" },
        { label: "Roles", value: "4" },
        { label: "Farmacias", value: "1" },
        { label: "Integraciones", value: "0" },
      ]}
      columns={[
        { key: "ajuste", label: "Ajuste" },
        { key: "valor", label: "Valor" },
        { key: "ambito", label: "Ámbito" },
        { key: "estado", label: "Estado" },
      ]}
      rows={[
        { id: "1", ajuste: "Nombre comercial", valor: "Farmacia Ejemplo", ambito: "Farmacia", estado: "Configurado" },
        { id: "2", ajuste: "CCAA", valor: "Madrid", ambito: "Fiscal / normativa", estado: "Configurado" },
        { id: "3", ajuste: "Stock mínimo por defecto", valor: "10 ud.", ambito: "Almacén", estado: "Configurado" },
        { id: "4", ajuste: "TPV / Excel ventas", valor: "No conectado", ambito: "Integración", estado: "Pendiente" },
      ]}
    />
  );
}
