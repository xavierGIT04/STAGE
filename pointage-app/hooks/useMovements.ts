'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMovements } from '@/services/api'
import type { BadgeEvent } from '@/types'

interface UseMovementsReturn {
  events:    BadgeEvent[]
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

export function useMovements(date: string): UseMovementsReturn {
  const [events,    setEvents]    = useState<BadgeEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [tick,      setTick]      = useState(0)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMovements(date)
      setEvents(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [date, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    events,
    isLoading,
    error,
    refetch: () => setTick(t => t + 1),
  }
}
