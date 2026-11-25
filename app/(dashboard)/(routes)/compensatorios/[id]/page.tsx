import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, User, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";
import getCompensatoriosById from "@/actions/getCompensatoriosbyId";
import getUsersById from "@/actions/getUsersById";
import { isAdmin } from "@/lib/auth/admin-check";
import { canViewAllCompensatorys } from "@/lib/auth/compensatory-permissions";
import { getRequestUser } from "@/lib/auth/request-user";
import { buildCompensatoryHistory } from "@/lib/compensatorios/history";

export const dynamic = "force-dynamic";

export default async function CompensatoriosbyId({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string | string[]; page?: string | string[] }>;
}) {
  const [{ id }, filters, { data: { user }, error }] = await Promise.all([
    params, searchParams, getRequestUser(),
  ]);

  if (error || !user) {
    redirect("/login");
  }

  if (id !== user.id && !(await isAdmin(user.id)) && !(await canViewAllCompensatorys(user.id))) {
    redirect("/");
  }

  const [movements, userData] = await Promise.all([getCompensatoriosById(id), getUsersById(id)]);
  const history = buildCompensatoryHistory(movements, {
    year: typeof filters.year === "string" ? filters.year : undefined,
    page: typeof filters.page === "string" ? filters.page : undefined,
  });
  const pathname = `/compensatorios/${id}`;

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Entradas */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Entradas{history.year && ` de ${history.year}`}</p>
              <p className="text-2xl font-bold text-green-600">+{history.totalEntries} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>

          {/* Total Salidas */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Salidas{history.year && ` de ${history.year}`}</p>
              <p className="text-2xl font-bold text-red-500">-{history.totalExits} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>

          {/* Saldo Actual */}
          <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-gray-100">
            <div className="flex-shrink-0 mr-4">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Saldo Actual</p>
              <p className="text-2xl font-bold text-gray-900">{userData[0]?.num_compensatorys || "0"} <span className="text-base font-normal text-gray-500">hrs</span></p>
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="flex items-center space-x-3 mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">{userData[0]?.name || "Usuario"}</p>
        </div>

        <section id="movimientos" aria-labelledby="movimientos-titulo" className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
            <h1 id="movimientos-titulo" className="text-lg font-semibold text-gray-900">Historial de compensatorios</h1>
            <form key={history.year ?? ""} action={`${pathname}#movimientos`} method="get" className="flex flex-wrap items-end gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Año
                <select name="year" defaultValue={history.year ?? ""} className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                  <option value="">Todos los años</option>
                  {history.years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <Button type="submit" variant="outline">Aplicar</Button>
            </form>
          </div>
          <DataTable
            columns={columns}
            data={history.rows}
            emptyMessage={history.year ? `No hay movimientos en ${history.year}` : "No hay movimientos en la cuenta"}
          />
          {history.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:px-6">
              <p className="text-sm tabular-nums text-gray-600">
                {history.first}–{history.last} de {history.total} {history.total === 1 ? "movimiento" : "movimientos"}
              </p>
              {history.pages > 1 && (
                <nav aria-label="Paginación del historial" className="flex w-full items-center justify-between gap-1 sm:w-auto sm:gap-2">
                  {history.page > 1 ? (
                    <Button variant="outline" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" asChild>
                      <Link href={pageHref(pathname, history.year, history.page - 1)}><ChevronLeft aria-hidden className="mr-1 h-3 w-3" />Anterior</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" disabled>
                      <ChevronLeft aria-hidden className="mr-1 h-3 w-3" />Anterior
                    </Button>
                  )}
                  <span className="whitespace-nowrap text-xs tabular-nums text-gray-600 sm:text-sm">Página {history.page} de {history.pages}</span>
                  {history.page < history.pages ? (
                    <Button variant="outline" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" asChild>
                      <Link href={pageHref(pathname, history.year, history.page + 1)}>Siguiente<ChevronRight aria-hidden className="ml-1 h-3 w-3" /></Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm" disabled>
                      Siguiente<ChevronRight aria-hidden className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </nav>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function pageHref(pathname: string, year: string | undefined, page: number) {
  const query = new URLSearchParams({ page: String(page) });
  if (year) query.set("year", year);
  return `${pathname}?${query}#movimientos`;
}
