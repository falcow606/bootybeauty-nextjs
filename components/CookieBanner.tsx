'use client'
import { useEffect, useState } from 'react'

function getConsentCookie() {
  const m = document.cookie.match(/(?:^|;\s*)bb_consent=(granted|denied)/)
  return m ? m[1] : null
}
function setConsentCookie(v: 'granted' | 'denied') {
  const oneYear = 365 * 24 * 60 * 60
  document.cookie = `bb_consent=${v}; path=/; max-age=${oneYear}; SameSite=Lax`
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const v = getConsentCookie()
    if (!v) setVisible(true)
  }, [])

  const accept = () => {
    setConsentCookie('granted')
    // Consent Mode : tout accordé
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        ad_storage: 'granted',
        analytics_storage: 'granted',
      })
      window.gtag('event', 'consent_update', { status: 'granted' })
      if ((window as any).__bb_gaid) {
        window.gtag('config', (window as any).__bb_gaid)
      }
    }
    setVisible(false)
  }

  const decline = () => {
    setConsentCookie('denied')
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ad_storage: 'denied',
        analytics_storage: 'denied',
      })
      window.gtag('event', 'consent_update', { status: 'denied' })
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-3xl m-4 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur px-5 py-4 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-700">
            Nous utilisons des cookies d’analyse (GA4) pour améliorer le site. Vous pouvez accepter
            ou refuser. Vos choix sont conservés pendant 12 mois.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={decline}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Refuser
            </button>
            <button
              onClick={accept}
              className="rounded-xl bg-[#C4A092] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
