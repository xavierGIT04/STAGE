'use client'

/**
 * usePresence — polling du snapshot toutes les POLL_INTERVAL ms.
 * Lecture seule : le badge est géré par l'ESP, pas par le frontend.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getPresenceSnapshot } from '@/services/api'
import type { Employee, BadgeEvent, DashboardStats } from '@/types'
import { TOTAL_EMPLOYEES } from '@/data/mockData'

const POLL_INTERVAL = 5000

interface UsePresenceReturn {
  employees: Employee[]
  events:    BadgeEvent[]
  stats:     DashboardStats
  isLoading: boolean
  error:     string | null
  lastSync:  Date | null
}

const DEFAULT_STATS: DashboardStats = {
  totalEmployees: TOTAL_EMPLOYEES,
  presentCount:   0,
  arrivedToday:   0,
  departedToday:  0,
  pendingArrival: TOTAL_EMPLOYEES,
  presenceRate:   0,
}

export function usePresence(): UsePresenceReturn {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [events,    setEvents]    = useState<BadgeEvent[]>([])
  const [stats,     setStats]     = useState<DashboardStats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [lastSync,  setLastSync]  = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSnapshot = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      setError(null)
      const snap = await getPresenceSnapshot()
      setEmployees(snap.employees)
      setEvents(snap.events)
      setStats(snap.stats)
      setLastSync(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSnapshot(false)
    intervalRef.current = setInterval(() => fetchSnapshot(true), POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchSnapshot])

  return { employees, events, stats, isLoading, error, lastSync }
}
