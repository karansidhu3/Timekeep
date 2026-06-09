'use client'

export default function ClientDate() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    </span>
  )
}
