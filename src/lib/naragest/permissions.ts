export type NgRole = "admin_org" | "titular" | "adjunto" | "tecnico" | "auxiliar";

const WRITE_ROLES: NgRole[] = ["admin_org", "titular", "adjunto", "tecnico"];
const DELETE_ROLES: NgRole[] = ["admin_org", "titular", "adjunto"];
const EXPORT_ROLES: NgRole[] = ["admin_org", "titular", "adjunto", "tecnico"];

export function canWrite(role: NgRole) {
  return WRITE_ROLES.includes(role);
}
export function canDelete(role: NgRole) {
  return DELETE_ROLES.includes(role);
}
export function canExport(role: NgRole) {
  return EXPORT_ROLES.includes(role);
}
