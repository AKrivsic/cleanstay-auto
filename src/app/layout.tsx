import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import '@/styles/chatbot.css'
import '@/css/base.css'
import '@/css/components.css'
import '@/css/layout.css'
import '@/css/pages.css'
import '@/css/style.css'
import ChatWidget from '@/components/Chatbot/ChatWidget'

export const metadata: Metadata = {
  title: 'CleanStay - Profesionální úklid',
  description: 'Profesionální úklid domácností, kanceláří a Airbnb v Praze. Férové ceny, spolehlivost a rychlost.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5KMW8ZTG');
            `,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5KMW8ZTG"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <ChatWidget />
        {/* Fenrik Chat Widget */}
        <Script
          src="https://widget.fenrik.chat/embed.js?id=7ba6b8f5-b7ae-415e-aef1-4c08b6e1b611"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

