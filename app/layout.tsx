import "./globals.css";
import ToasterProvider from "@/components/toaster-provider";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Emb-App",
  description: "Sistema de gestión de personal para la Embajada del Perú en Japón",
  openGraph: {
    title: "Emb-App",
    description: "Sistema de gestión de personal para la Embajada del Perú en Japón",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
