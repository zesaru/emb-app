import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const feedbackFlows = [
  "app/(dashboard)/(routes)/vacaciones/new/_components/vacation-form.tsx",
  "app/(dashboard)/(routes)/compensatorios/new/_components/compensatory-form.tsx",
  "app/(dashboard)/(routes)/compensatorios/request/_components/requestForm.tsx",
  "app/(dashboard)/_components/data-table-row-actions.tsx",
  "app/(dashboard)/_components/data-table-row-actions-hours.tsx",
  "app/(dashboard)/_components/data-table-row-actions-vacations.tsx",
  "app/(dashboard)/_components/cancel-request-button.tsx",
  "app/(dashboard)/_components/super-admin-force-cancel-button.tsx",
  "app/(dashboard)/(routes)/admin/users/_components/users-admin-panel.tsx",
  "app/(dashboard)/(routes)/backups/components/create-backup-button.tsx",
  "app/(dashboard)/(routes)/backups/components/backup-list.tsx",
  "app/reset/_components/resetForm.tsx",
] as const;

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("feedback de mutaciones", () => {
  it("usa Sonner como único proveedor global de toasts", () => {
    const layout = readSource("app/layout.tsx");
    const provider = readSource("components/toaster-provider.tsx");

    expect(layout).toContain("<ToasterProvider />");
    expect(provider).toMatch(/from\s+["']sonner["']/);
  });

  it.each(feedbackFlows)("%s informa éxito y error mediante Sonner", (file) => {
    const source = readSource(file);

    expect(source).toMatch(/from\s+["']sonner["']/);
    expect(source).not.toContain("react-toastify");
    expect(source).toContain("toast.success(");
    expect(source).toContain("toast.error(");
  });
});
