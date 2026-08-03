import { beforeEach, describe, expect, it, vi } from "vitest";

const requireCurrentUserSuperAdminAndActiveMock = vi.fn();
const backupServiceMock = {
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
};
const notifyBackupSuccessMock = vi.fn();
const notifyBackupFailureMock = vi.fn();
const notifyRestoreSuccessMock = vi.fn();
const notifyRestoreFailureMock = vi.fn();
const listLocalBackupsMock = vi.fn();
const listCloudBackupsMock = vi.fn();

vi.mock("@/lib/auth/admin-check", () => ({
  requireCurrentUserSuperAdminAndActive: (...args: any[]) => requireCurrentUserSuperAdminAndActiveMock(...args),
}));

vi.mock("@/lib/backup/backup-service", () => ({
  backupService: backupServiceMock,
}));

vi.mock("@/lib/backup/email-notifier", () => ({
  emailNotifier: {
    notifyBackupSuccess: (...args: any[]) => notifyBackupSuccessMock(...args),
    notifyBackupFailure: (...args: any[]) => notifyBackupFailureMock(...args),
    notifyRestoreSuccess: (...args: any[]) => notifyRestoreSuccessMock(...args),
    notifyRestoreFailure: (...args: any[]) => notifyRestoreFailureMock(...args),
  },
}));

vi.mock("@/lib/backup/storage-manager", () => ({
  storageManager: {
    listLocalBackups: (...args: any[]) => listLocalBackupsMock(...args),
    listCloudBackups: (...args: any[]) => listCloudBackupsMock(...args),
  },
}));

describe("Backup actions - autorización exclusiva de super admin (requireCurrentUserSuperAdminAndActive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBackup", () => {
    it("rechaza si el usuario no es admin activo, sin ejecutar el backup", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(new Error("Usuario inactivo"));

      const { createBackup } = await import("@/actions/create-backup");
      const result = await createBackup();

      expect(result).toEqual({ success: false, error: "Usuario inactivo", duration: 0 });
      expect(backupServiceMock.createBackup).not.toHaveBeenCalled();
    });

    it("rechaza si el usuario es admin normal pero no super admin", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(
        new Error("No autorizado: Se requieren privilegios de super administrador"),
      );

      const { createBackup } = await import("@/actions/create-backup");
      const result = await createBackup();

      expect(result).toEqual({
        success: false,
        error: "No autorizado: Se requieren privilegios de super administrador",
        duration: 0,
      });
      expect(backupServiceMock.createBackup).not.toHaveBeenCalled();
    });

    it("ejecuta el backup y notifica éxito cuando el usuario es admin activo", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockResolvedValue("admin-1");
      backupServiceMock.createBackup.mockResolvedValue({
        success: true,
        metadata: { id: "backup-1" },
        duration: 100,
      });

      const { createBackup } = await import("@/actions/create-backup");
      const result = await createBackup();

      expect(result.success).toBe(true);
      expect(notifyBackupSuccessMock).toHaveBeenCalled();
      expect(notifyBackupFailureMock).not.toHaveBeenCalled();
    });
  });

  describe("getBackups", () => {
    it("propaga el rechazo si el usuario no es admin activo, sin listar backups", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(new Error("No autorizado"));
      listLocalBackupsMock.mockResolvedValue([]);
      listCloudBackupsMock.mockResolvedValue([]);

      const { getBackups } = await import("@/actions/get-backups");

      await expect(getBackups()).rejects.toThrow("No autorizado");
      expect(listLocalBackupsMock).not.toHaveBeenCalled();
    });

    it("lista y deduplica backups cuando el usuario es admin activo", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockResolvedValue("admin-1");
      listLocalBackupsMock.mockResolvedValue([
        { id: "b1", createdAt: new Date("2026-01-01"), storageLocation: ["local"] },
      ]);
      listCloudBackupsMock.mockResolvedValue([
        { id: "b1", createdAt: new Date("2026-01-01"), storageLocation: ["cloud"] },
      ]);

      const { getBackups } = await import("@/actions/get-backups");
      const result = await getBackups();

      expect(result).toHaveLength(1);
      expect(result[0].storageLocation.sort()).toEqual(["cloud", "local"]);
    });
  });

  describe("restoreBackup", () => {
    it("rechaza si el usuario no es admin activo, sin ejecutar el restore", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockRejectedValue(new Error("No autorizado: Se requieren privilegios de administrador"));

      const { restoreBackup } = await import("@/actions/restore-backup");
      const result = await restoreBackup("backup-1");

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          error: "No autorizado: Se requieren privilegios de administrador",
          tablesAffected: [],
        }),
      );
      expect(backupServiceMock.restoreBackup).not.toHaveBeenCalled();
    });

    it("ejecuta el restore y notifica éxito cuando el usuario es admin activo", async () => {
      requireCurrentUserSuperAdminAndActiveMock.mockResolvedValue("admin-1");
      backupServiceMock.restoreBackup.mockResolvedValue({
        success: true,
        restoredAt: new Date(),
        tablesAffected: ["users", "vacations", "compensatorys", "attendances"],
      });

      const { restoreBackup } = await import("@/actions/restore-backup");
      const result = await restoreBackup("backup-1");

      expect(result.success).toBe(true);
      expect(backupServiceMock.restoreBackup).toHaveBeenCalledWith("backup-1");
      expect(notifyRestoreSuccessMock).toHaveBeenCalledWith(result.tablesAffected);
    });
  });
});
