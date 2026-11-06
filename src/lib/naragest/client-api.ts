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

export async function fetchClients(): Promise<ApiClient[]> {
  const res = await fetch("/api/naragest/clientes", { credentials: "include" });
  const json = await parseJson<{ data: ApiClient[] }>(res);
  return json.data ?? [];
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
