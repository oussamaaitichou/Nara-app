export type ApiClient = {
  id: string;
  organization_id: string;
  code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  program: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ApiCase = {
  id: string;
  organization_id: string;
  client_id: string;
  number: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignee_user_id: string | null;
  due_at: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
};

export type NgMeta = {
  organizationId: string;
  orgName?: string;
  roleId: string;
  canWrite: boolean;
  canDelete?: boolean;
  canExport?: boolean;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : `Error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchClients(): Promise<{ data: ApiClient[]; meta?: NgMeta }> {
  const res = await fetch("/api/naragest/clientes", { credentials: "include" });
  return parseJson(res);
}

export async function createClientApi(body: {
  fullName: string;
  phone?: string;
  email?: string;
  program?: "fidelizacion" | "spd" | "ninguno";
  status?: "activo" | "inactivo" | "bloqueado";
}): Promise<ApiClient> {
  const res = await fetch("/api/naragest/clientes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson<{ data: ApiClient }>(res);
  return json.data;
}

export async function deleteClientApi(id: string): Promise<void> {
  const res = await fetch(`/api/naragest/clientes?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseJson(res);
}

export async function exportClientsCsv(): Promise<Blob> {
  const res = await fetch("/api/naragest/clientes?export=csv", { credentials: "include" });
  if (!res.ok) throw new Error("No se pudo exportar");
  return res.blob();
}

export async function fetchCases(clientId?: string): Promise<{ data: ApiCase[]; meta?: NgMeta }> {
  const q = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  const res = await fetch(`/api/naragest/expedientes${q}`, { credentials: "include" });
  return parseJson(res);
}

export async function createCaseApi(body: {
  clientId: string;
  type: "spd" | "reclamacion" | "inspeccion_prep" | "servicio" | "otro";
  title: string;
  description?: string;
  priority?: "urgente" | "alta" | "media" | "baja";
  status?: "abierto" | "en_curso" | "en_revision" | "bloqueado" | "cerrado";
}): Promise<ApiCase> {
  const res = await fetch("/api/naragest/expedientes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await parseJson<{ data: ApiCase }>(res);
  return json.data;
}

export async function updateCaseApi(
  id: string,
  body: Partial<{
    type: string;
    title: string;
    description: string;
    priority: string;
    status: string;
  }>,
): Promise<ApiCase> {
  const res = await fetch("/api/naragest/expedientes", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...body }),
  });
  const json = await parseJson<{ data: ApiCase }>(res);
  return json.data;
}
