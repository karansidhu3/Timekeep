import { describe, it, expect } from 'vitest'
import { haversineMeters } from '@/lib/haversine'

describe('haversineMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineMeters(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0)
  })

  it('returns approximate distance between SF and LA (~559km)', () => {
    // SF: 37.7749, -122.4194  |  LA: 34.0522, -118.2437
    const dist = haversineMeters(37.7749, -122.4194, 34.0522, -118.2437)
    expect(dist).toBeGreaterThan(550_000)
    expect(dist).toBeLessThan(570_000)
  })

  it('returns approximate distance between two nearby points (~111m per 0.001 deg)', () => {
    // ~0.001 degree latitude ≈ 111 meters
    const dist = haversineMeters(37.0000, -122.0000, 37.0010, -122.0000)
    expect(dist).toBeGreaterThan(100)
    expect(dist).toBeLessThan(125)
  })

  it('is symmetric', () => {
    const a = haversineMeters(37.0, -122.0, 38.0, -123.0)
    const b = haversineMeters(38.0, -123.0, 37.0, -122.0)
    expect(Math.abs(a - b)).toBeLessThan(0.001)
  })

  it('equatorial degree ≈ 111 km', () => {
    const dist = haversineMeters(0, 0, 1, 0)
    expect(dist).toBeGreaterThan(110_000)
    expect(dist).toBeLessThan(112_000)
  })

  it('handles antipodal points (~20,015 km)', () => {
    const dist = haversineMeters(0, 0, 0, 180)
    expect(dist).toBeGreaterThan(20_000_000)
  })
})
