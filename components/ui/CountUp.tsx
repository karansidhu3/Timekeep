'use client'

import { useEffect, useRef, useState } from 'react'

export default function CountUp({ value, duration = 560 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined)
  const startRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    startRef.current = undefined
    function step(ts: number) {
      if (startRef.current === undefined) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <>{display}</>
}
