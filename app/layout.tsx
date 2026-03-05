import type { Metadata } from 'next'
import '../styles/globals.css'
import { ThemeProvider }  from '@/context/ThemeContext'
import { GameProvider }   from '@/context/GameContext'
import { ToastProvider }  from '@/context/ToastContext'
import Header from '@/components/layout/Header'
import StarsBg from '@/components/layout/StarsBg'

export const metadata: Metadata = {
  title: 'Quiz Championship — Seat of Wisdom Group of Schools',
  description: 'School quiz competition platform for Seat of Wisdom Group of Schools',
  icons: { icon: '/logo.jpeg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <GameProvider>
            <ToastProvider>
              <StarsBg />
              <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
                <Header />
                <main>{children}</main>
              </div>
            </ToastProvider>
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
