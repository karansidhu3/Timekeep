'use client'

// Time-of-day greeting — renders client-side to use local clock.
// Morning: 5–11, Afternoon: 12–16, Evening: 17–4
function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)  return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Greeting({ name }: { name: string }) {
  return <>{getGreeting()}, {name}</>
}
