import { createFileRoute } from "@tanstack/react-router";
import {
  createClient,
  exportClientsCsv,
  listClients,
  softDeleteClient,
  updateClient,
} from "@/lib/naragest/repo.server";
import { createClientSchema, updateClientSchema } from "@/lib/naragest/schema";

/**
 * TODO de producción: resolver organizationId y actor desde sesión Better Auth
 * + ng_memberships. Mientras tanto se usa cabecera de desarrollo controlada.
 */
function ctx(request: Request) {
  const organizationId = request.headers.get("x-ng-org-id")?.trim();
  const actorUserId = request.headers.get("x-ng-user-id")?.trim() ?? null;
  if (!organizationId) {
    return { error: Response.json({ error: "Falta organización (x-ng-org-id)." }, { status: 401 }) };
  }
  return { organizationId, actorUserId };
}

export const Route = createFileRoute("/api/naragest/clientes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
        const url = new URL(request.url);
        if (url.searchParams.get("export") === "csv") {
          const csv = await exportClientsCsv(c.organizationId, c.actorUserId);
          return new Response(csv, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="clientes-naragest.csv"',
            },
          });
        }
        const rows = await listClients(c.organizationId);
        return Response.json({ data: rows });
      },

      POST: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }
        const parsed = createClientSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Validación", details: parsed.error.flatten() }, { status: 422 });
        }
        const row = await createClient(c.organizationId, c.actorUserId, parsed.data);
        return Response.json({ data: row }, { status: 201 });
      },

      PATCH: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSON inválido" }, { status: 400 });
        }
        const id = (body as { id?: string }).id;
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const parsed = updateClientSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Validación", details: parsed.error.flatten() }, { status: 422 });
        }
        const row = await updateClient(c.organizationId, c.actorUserId, id, parsed.data);
        if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ data: row });
      },

      DELETE: async ({ request }) => {
        const c = ctx(request);
        if ("error" in c) return c.error;
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const ok = await softDeleteClient(c.organizationId, c.actorUserId, id);
        if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
