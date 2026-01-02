import './globals.css'
import ToasterProvider from '@/components/toaster-provider'

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
        <ToasterProvider />
        {children}
      </body>
    </html>
  )
}
