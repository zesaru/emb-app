import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const revalidatePathMock = vi.fn();
const sendOrCaptureEmailMock = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => revalidatePathMock(...args),
}));

vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: (...args: any[]) => sendOrCaptureEmailMock(...args),
}));

function buildFormData(overrides: Partial<Record<string, string>> = {}) {
  const data: Record<string, string> = {
    event_name: "Trabajo extra",
    hours: "4",
    event_date: "2026-07-01",
    ...overrides,
  };
  return {
    get: (key: string) => data[key] ?? null,
  } as unknown as FormData;
}

describe("addPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendOrCaptureEmailMock.mockResolvedValue({});
  });

  it("retorna error y no envía email si el insert falla", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
      statusText: "Internal Server Error",
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: selectMock,
        })),
      })),
    });

    const { addPost } = await import("@/actions/add-compensatorios");
    const result = await addPost(buildFormData());

    expect(result).toEqual({ success: false, error: "Error creando registro" });
    expect(sendOrCaptureEmailMock).not.toHaveBeenCalled();
  });

  it("retorna éxito cuando el insert es correcto", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [{ id: "comp-1" }],
      error: null,
      statusText: "Created",
    });

    const usersSingleMock = vi.fn().mockResolvedValue({
      data: { name: "Test User" },
      error: null,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "compensatorys") {
          return {
            insert: vi.fn(() => ({
              select: selectMock,
            })),
          };
        }
        if (table === "users") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: usersSingleMock,
              })),
            })),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    });

    const { addPost } = await import("@/actions/add-compensatorios");
    const result = await addPost(buildFormData());

    expect(result.success).toBe(true);
    expect(sendOrCaptureEmailMock).toHaveBeenCalled();
  });

  it("rechaza horas fuera de rango sin llegar a consultar la base de datos", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "user@example.com" } },
          error: null,
        }),
      },
      from: vi.fn(() => {
        throw new Error("no debería llegar a consultar la base de datos");
      }),
    });

    const { addPost } = await import("@/actions/add-compensatorios");
    const result = await addPost(buildFormData({ hours: "13" }));

    expect(result).toEqual({ success: false, error: "Horas deben estar entre 1 y 12" });
  });
});
