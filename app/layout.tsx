import './globals.css'
import ToasterProvider from '@/components/toaster-provider'

export const metadata = {
  title: 'Emb-App',
  description: 'app',
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
