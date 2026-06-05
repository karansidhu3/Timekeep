'use client'

import { format } from 'date-fns'

interface Props {
  iso: string
  fmt?: string
}

export default function ClientTime({ iso, fmt = 'h:mm a' }: Props) {
  return <>{format(new Date(iso), fmt)}</>
}
