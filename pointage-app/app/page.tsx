'use client'

import { useState } from 'react'
import Header, { type Tab } from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import Analytics from '@/components/Analytics'
import Mouvements from '@/components/Mouvements'
import { usePresence } from '@/hooks/usePresence'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const { employees, events, stats, isLoading, error, lastSync } = usePresence()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={!error}
        lastSync={lastSync}
      />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>

        {activeTab === 'dashboard' && (
          <div className="fade-up">
            <Dashboard
              employees={employees}
              events={events}
              stats={stats}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="fade-up">
            <Analytics />
          </div>
        )}

        {activeTab === 'mouvements' && (
          <div className="fade-up">
            <Mouvements />
          </div>
        )}

      </main>
    </div>
  )
}
