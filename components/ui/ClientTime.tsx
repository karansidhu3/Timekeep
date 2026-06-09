'use client'

import { formatTimePST } from '@/lib/utils'

interface Props {
  iso: string
  fmt?: string  // accepted for backwards compat, formatTimePST is always used
}

export default function ClientTime({ iso }: Props) {
  return <>{formatTimePST(iso)}</>
}
