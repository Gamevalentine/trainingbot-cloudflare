import type { Metadata } from 'next'
import './globals.css'
import './polish.css'
import './social.css'
import './profile-fix.css'
import './facebook.css'

export const metadata: Metadata = {
  title: 'Kết Nối',
  description: 'Cộng đồng dành cho người trưởng thành: chia sẻ, kết nối và hẹn hò.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>
}
