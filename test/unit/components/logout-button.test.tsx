import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import LogoutButton from "@/components/LogoutButton";

const mocks = vi.hoisted(() => ({ error: vi.fn(), replace: vi.fn(), fetch: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  vi.stubGlobal("window", Object.create(window, { location: { value: { replace: mocks.replace } } }));
});
afterEach(() => vi.unstubAllGlobals());

it("bloquea clics repetidos y abandona el panel con una navegación completa al cerrar", async () => {
  let finish!: (response: Response) => void;
  mocks.fetch.mockReturnValue(new Promise<Response>((resolve) => { finish = resolve; }));
  render(<LogoutButton />);
  const button = screen.getByRole("button", { name: "Cerrar sesión" });
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Cerrando sesión…" })).toBeDisabled();
  fireEvent.click(button);
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.fetch).toHaveBeenCalledWith("/auth/sign-out", expect.objectContaining({ method: "POST", headers: { Accept: "application/json" } }));
  finish(new Response(JSON.stringify({ success: true }), { status: 200 }));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
});
it.each(["server", "network"])("muestra el error y permite reintentar sin abandonar el panel: %s", async (failure) => {
  if (failure === "server") mocks.fetch.mockResolvedValue(new Response("{}", { status: 503 }));
  else mocks.fetch.mockRejectedValue(new Error("offline"));
  render(<LogoutButton />);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo cerrar la sesión. Inténtalo de nuevo."));
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
});
