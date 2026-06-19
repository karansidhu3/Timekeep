'use client'

import { useEffect } from 'react'

export default function SpringHandler() {
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = (e.target as Element).closest('[data-spring]') as HTMLElement | null
      if (!target) return
      target.classList.remove('animate-press-spring')
      void target.offsetWidth // force reflow to restart animation
      target.classList.add('animate-press-spring')
    }
    function onAnimationEnd(e: AnimationEvent) {
      if (e.animationName === 'press-spring') {
        ;(e.target as Element).classList.remove('animate-press-spring')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('animationend', onAnimationEnd)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('animationend', onAnimationEnd)
    }
  }, [])
  return null
}
