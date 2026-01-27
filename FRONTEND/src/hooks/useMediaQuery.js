import { useState, useEffect } from 'react'

/**
 * Devuelve true cuando el viewport cumple la media query.
 * @param {string} query - Ej: '(max-width: 1023px)', '(min-width: 768px)'
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}
