import './globals.css'
import { ToastProvider } from '@/components/toast-provider';

export const metadata = {
  title: 'Emb-App',
  description: 'app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
