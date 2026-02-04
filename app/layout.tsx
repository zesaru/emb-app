import './globals.css'
import ToasterProvider from '@/components/toaster-provider'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Emb-App',
  description: 'Employee Management System for the Peruvian Embassy in Japan',
  openGraph: {
    title: 'Emb-App',
    description: 'Employee Management System for the Peruvian Embassy in Japan',
    type: 'website',
  },
}

// Iniciar el scheduler de backups solo en el servidor
if (typeof window === 'undefined' && process.env.BACKUP_ENABLED === 'true') {
  import('@/lib/backup/scheduler').then(({ startBackupScheduler }) => {
    startBackupScheduler();
  });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  )
}
