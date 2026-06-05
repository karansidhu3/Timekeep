'use client'

// Renders today's date client-side to avoid server/UTC timezone mismatch
export default function ClientDate() {
  return (
    <>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })}
    </>
  )
}
