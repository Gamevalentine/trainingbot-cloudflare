import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kết Nối',
  description: 'Hẹn hò dành cho người trưởng thành, chỉ trò chuyện khi cùng thích nhau.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>
}
