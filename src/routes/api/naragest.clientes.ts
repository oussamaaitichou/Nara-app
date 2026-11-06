import { createFileRoute } from "@tanstack/react-router";
import {
  canDelete,
  canExport,
  canWrite,
  resolveNgAccess,
} from "@/lib/naragest/access.server";
import {
  createClient,
  exportClientsCsv,
  listClients,
  softDeleteClient,
  updateClient,
} from "@/lib/naragest/repo.server";
import { createClientSchema, updateClientSchema } from "@/lib/naragest/schema";

export const Route = createFileRoute("/api/naragest/clientes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        const { access } = resolved;
        const url = new URL(request.url);
        if (url.searchParams.get("export") === "csv") {
          if (!canExport(access.roleId)) {
            return Response.json({ error: "Sin permiso de exportación" }, { status: 403 });
          }
          const csv = await exportClientsCsv(access.organizationId, access.userId);
          return new Response(csv, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": 'attachment; filename="clientes-naragest.csv"',
            },
          });
        }
        const rows = await listClients(access.organizationId);
        return Response.json({
          data: rows,
          meta: {
            organizationId: access.organizationId,
            orgName: access.orgName,
            roleId: access.roleId,
            canWrite: canWrite(access.roleId),
            canDelete: canDelete(access.roleId),
            canExport: canExport(access.roleId),
          },
        });
      },

      POST: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
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
        const row = await createClient(
          resolved.access.organizationId,
          resolved.access.userId,
          parsed.data,
        );
        return Response.json({ data: row }, { status: 201 });
      },

      PATCH: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        if (!canWrite(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de escritura" }, { status: 403 });
        }
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
        const row = await updateClient(
          resolved.access.organizationId,
          resolved.access.userId,
          id,
          parsed.data,
        );
        if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ data: row });
      },

      DELETE: async ({ request }) => {
        const resolved = await resolveNgAccess(request);
        if (!resolved.ok) {
          return Response.json({ error: resolved.error }, { status: resolved.status });
        }
        if (!canDelete(resolved.access.roleId)) {
          return Response.json({ error: "Sin permiso de borrado" }, { status: 403 });
        }
        const id = new URL(request.url).searchParams.get("id");
        if (!id) return Response.json({ error: "Falta id" }, { status: 400 });
        const ok = await softDeleteClient(
          resolved.access.organizationId,
          resolved.access.userId,
          id,
        );
        if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
        return Response.json({ ok: true });
      },
    },
  },
});
