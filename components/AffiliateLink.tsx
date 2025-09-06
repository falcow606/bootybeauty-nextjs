'use client'
import React from 'react'

type Props = {
  href: string
  merchant?: string
  slug?: string
  pos?: number | string
  className?: string
  children: React.ReactNode
}

/**
 * Lien d’affiliation standardisé :
 * - target="_blank" + rel="nofollow sponsored noopener"
 * - data-aff="1" pour l’auto-tracking (affiliate_click)
 * - data-* (merchant/slug/pos) envoyés dans l’event GA4
 */
export default function AffiliateLink({
  href,
  merchant,
  slug,
  pos,
  className,
  children,
}: Props) {
  const isExternal = /^https?:\/\//i.test(href)

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'nofollow sponsored noopener' : undefined}
      data-aff="1"
      data-merchant={merchant || ''}
      data-slug={slug || ''}
      data-pos={pos !== undefined ? String(pos) : ''}
      className={className}
    >
      {children}
    </a>
  )
}
