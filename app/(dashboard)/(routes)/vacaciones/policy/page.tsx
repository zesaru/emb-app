import Link from "next/link";
import { ExternalLink, FileText, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const fullTimeBands = [
  ["6 meses", "10 días"],
  ["1 año y 6 meses", "11 días"],
  ["2 años y 6 meses", "12 días"],
  ["3 años y 6 meses", "14 días"],
  ["4 años y 6 meses", "16 días"],
  ["5 años y 6 meses", "18 días"],
  ["6 años y 6 meses o más", "20 días"],
];

const proportionalBands = [
  ["4 días por semana", "7 días al inicio"],
  ["3 días por semana", "5 días al inicio"],
  ["2 días por semana", "3 días al inicio"],
  ["1 día por semana", "1 día al inicio"],
];

export default function VacationPolicyPage() {
  return (
    <div className="space-y-6 p-5">
      <Card className="border-outline-variant/40 bg-surface-container-lowest shadow-ambient">
        <CardHeader className="space-y-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-secondary-container-foreground">
            <Scale className="h-3.5 w-3.5" />
            Referencia legal y operativa
          </div>
          <div>
            <CardTitle className="text-3xl [font-family:Manrope,Inter,ui-sans-serif,sans-serif]">
              Política de Vacaciones en Japón
            </CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
              Esta página resume la regla legal base y cómo emb-app la usa como
              referencia para calcular vacaciones, especialmente para
              diplomáticos y administradores que necesitan entender el criterio
              del sistema.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/vacaciones/new">Ir a solicitar vacaciones</Link>
          </Button>
          <Button asChild variant="link" className="px-0">
            <a
              href="https://www.japaneselawtranslation.go.jp/en/laws/view/3567"
              target="_blank"
              rel="noreferrer"
            >
              Ver base legal oficial
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>1. Regla general</CardTitle>
            <CardDescription>
              El derecho a vacaciones pagadas nace cuando la persona cumple dos
              condiciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <ul className="list-disc space-y-2 pl-5">
              <li>Ha trabajado de forma continua durante 6 meses desde su fecha de ingreso.</li>
              <li>Ha asistido al menos al 80% de sus días laborales programados.</li>
            </ul>
            <p>
              A partir de ese momento, los días aumentan conforme a la
              antigüedad. Para jornadas parciales, la ley usa una tabla
              proporcional.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Nota operativa en emb-app</CardTitle>
            <CardDescription>
              Como queremos empezar simple, este será el criterio funcional base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>emb-app toma en cuenta la fecha de ingreso registrada.</p>
            <p>La jornada aplicable debe distinguir entre esquema regular y proporcional.</p>
            <p>Los casos históricos o especiales pueden requerir ajuste administrativo manual.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>3. Tabla base para jornada regular</CardTitle>
            <CardDescription>
              Referencia para personas que trabajan 5 días o más por semana, o
              30 horas o más por semana.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-outline-variant/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Antigüedad</th>
                    <th className="px-4 py-3 font-medium">Días</th>
                  </tr>
                </thead>
                <tbody>
                  {fullTimeBands.map(([label, days]) => (
                    <tr key={label} className="border-t border-outline-variant/20">
                      <td className="px-4 py-3 text-muted-foreground">{label}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Tiempo parcial</CardTitle>
            <CardDescription>
              Cuando la persona trabaja menos días por semana, aplica una
              asignación proporcional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-outline-variant/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Jornada</th>
                    <th className="px-4 py-3 font-medium">Referencia inicial</th>
                  </tr>
                </thead>
                <tbody>
                  {proportionalBands.map(([label, days]) => (
                    <tr key={label} className="border-t border-outline-variant/20">
                      <td className="px-4 py-3 text-muted-foreground">{label}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Ejemplo: si una persona inició trabajando 3 días por semana, no
              necesariamente corresponde aplicar desde el primer ciclo la tabla
              completa de jornada regular.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>5. Consideraciones importantes</CardTitle>
          <CardDescription>
            Esto ayuda a interpretar bien el saldo y evitar decisiones
            incorrectas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>La asistencia efectiva puede influir en el derecho legal final.</p>
          <p>Los días otorgados no permanecen vigentes indefinidamente.</p>
          <p>
            Cambios de jornada, historiales incompletos o casos excepcionales
            pueden requerir revisión manual por administración.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>6. Base legal</CardTitle>
          </div>
          <CardDescription>Fuentes oficiales de referencia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <a
            className="block text-primary hover:underline"
            href="https://www.japaneselawtranslation.go.jp/en/laws/view/3567"
            target="_blank"
            rel="noreferrer"
          >
            Labour Standards Act of Japan, Article 39
          </a>
          <a
            className="block text-primary hover:underline"
            href="https://www.mhlw.go.jp/content/001395762.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Ministry of Health, Labour and Welfare (MHLW)
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
