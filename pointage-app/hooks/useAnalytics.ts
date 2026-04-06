'use client'

import { useState, useEffect } from 'react'
import { getAnalytics } from '@/services/api'
import type { AnalyticsData } from '@/types'

interface UseAnalyticsReturn {
  data:      AnalyticsData | null
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

const EMPTY: AnalyticsData = {
  earlyArrivals: [], lateArrivals: [],
  earlyDepartures: [], lateDepartures: [],
}

export function useAnalytics(date?: string): UseAnalyticsReturn {
  const [data,      setData]      = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [tick,      setTick]      = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    getAnalytics(date)
      .then(d  => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur') })
      .finally(()  => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [date, tick])

  return { data: data ?? EMPTY, isLoading, error, refetch: () => setTick(t => t + 1) }
}
