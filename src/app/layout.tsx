import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { LangProvider } from '@/context/LangContext'



export const metadata: Metadata = {
  title: 'Prof. Ahmad El-Ajou | Applied Mathematics',
  description:
    'Academic website of Prof. Ahmad Mohd Ishak El-Ajou, Full Professor of Mathematics at Al-Balqa Applied University, Jordan.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,400&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"          rel="stylesheet"
        />
      </head>
      <body>        {/*
          LangProvider يغلف كل شيء — يجعل useLang()
          متاحاً في Navbar وFooter وكل صفحة
        */}
        <LangProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  )
}