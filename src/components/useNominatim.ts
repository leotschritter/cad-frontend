// useNominatim.ts
export function useNominatim() {
  async function geocode(query: string) {
    if (!query?.trim()) return null
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    // optional: bias to a country: url.searchParams.set('countrycodes', 'it')

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        // identify your app; required by Nominatim usage policy
        'User-Agent': 'TripPlanner/1.0 (your-email@example.com)'
      }
    })
    if (!res.ok) return null
    const data = await res.json() as any[]
    const first = data?.[0]
    if (!first) return null

    const shortLabel =
      first.name ||
      first.display_name?.split(',')?.slice(0, 2).join(', ') ||
      query

    return {
      display: first.display_name as string,
      shortLabel,
      lat: Number(first.lat),
      lng: Number(first.lon),
      raw: first
    }
  }

  return { geocode }
}
