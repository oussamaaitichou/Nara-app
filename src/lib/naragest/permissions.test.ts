import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canDelete, canExport, canWrite, type NgRole } from "./access.server";

const roles: NgRole[] = ["admin_org", "titular", "adjunto", "tecnico", "auxiliar"];

describe("NaraGest role permissions", () => {
  it("auxiliar only reads", () => {
    assert.equal(canWrite("auxiliar"), false);
    assert.equal(canDelete("auxiliar"), false);
    assert.equal(canExport("auxiliar"), false);
  });

  it("tecnico writes and exports but does not delete", () => {
    assert.equal(canWrite("tecnico"), true);
    assert.equal(canExport("tecnico"), true);
    assert.equal(canDelete("tecnico"), false);
  });

  it("titular and admin have full ops", () => {
    for (const r of ["admin_org", "titular", "adjunto"] as NgRole[]) {
      assert.equal(canWrite(r), true);
      assert.equal(canDelete(r), true);
      assert.equal(canExport(r), true);
    }
  });

  it("every role is classified", () => {
    for (const r of roles) {
      assert.equal(typeof canWrite(r), "boolean");
      assert.equal(typeof canDelete(r), "boolean");
      assert.equal(typeof canExport(r), "boolean");
    }
  });
});
