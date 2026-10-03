import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/(dashboard)/_components/logo", () => ({ Logo: () => null }));
import Sidebar from "@/app/(dashboard)/_components/sidebar";

describe("menú con permisos recibidos del servidor", () => {
  it("el usuario normal recibe solo rutas de personal", () => {
    render(<Sidebar isAdmin={false} isSuperAdmin={false} />);
    expect(screen.getByRole("button", { name: /^Inicio$/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración de usuarios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Backups" })).not.toBeInTheDocument();
  });
  it("admin ve administración pero no backups", () => {
    render(<Sidebar isAdmin isSuperAdmin={false} />);
    expect(screen.getByRole("button", { name: "Administración de usuarios" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Backups" })).not.toBeInTheDocument();
  });
  it("superadmin recibe acceso visible a backups", () => {
    render(<Sidebar isAdmin isSuperAdmin />);
    expect(screen.getByRole("button", { name: "Backups" })).toBeVisible();
  });
});
