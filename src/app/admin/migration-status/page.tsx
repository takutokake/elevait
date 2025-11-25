'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HealthCheck {
  status: string
  checks: {
    supabase_connected: boolean
    availability_slots_exists: boolean
    bookings_exists: boolean
    functions_exist: boolean
    migration_needed: boolean
  }
  message: string
  instructions?: string
}

export default function MigrationStatus() {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to check health')
      }
    } catch (err) {
      console.error('Health check error:', err)
      setError('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#333333] dark:text-white mb-2">
          Database Migration Status
        </h1>
        <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
          Check if the booking system database is properly set up
        </p>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Checking database status...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          {/* Overall Status */}
          <Card className={health.status === 'ready' ? 'border-green-500' : 'border-yellow-500'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Overall Status</CardTitle>
                <Badge
                  className={
                    health.status === 'ready'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }
                >
                  {health.status === 'ready' ? '✅ Ready' : '⚠️ Migration Required'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-semibold">{health.message}</p>
              {health.instructions && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    {health.instructions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CheckItem
                label="Supabase Connection"
                status={health.checks.supabase_connected}
                description="Can connect to Supabase database"
              />
              <CheckItem
                label="availability_slots Table"
                status={health.checks.availability_slots_exists}
                description="Table for storing mentor availability"
              />
              <CheckItem
                label="bookings Table"
                status={health.checks.bookings_exists}
                description="Table for storing booking records"
              />
              <CheckItem
                label="Database Functions"
                status={health.checks.functions_exist}
                description="Helper functions like create_booking()"
              />
            </CardContent>
          </Card>

          {/* Migration Instructions */}
          {health.checks.migration_needed && (
            <Card className="border-blue-500">
              <CardHeader>
                <CardTitle>How to Run Migration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Step 1: Open Supabase Dashboard</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Go to{' '}
                    <a
                      href="https://app.supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      app.supabase.com
                    </a>{' '}
                    and select your project
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 2: Open SQL Editor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click "SQL Editor" in the left sidebar, then "New Query"
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 3: Copy Migration SQL</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Open the file <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">supabase_booking_migration.sql</code> from your project root
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Copy all contents (Cmd+A, Cmd+C)
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 4: Run Migration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paste into SQL Editor and click "Run" (or Cmd+Enter)
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Step 5: Verify</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Come back to this page and click "Refresh Status" below
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    📖 For detailed instructions, see <code>MIGRATION_INSTRUCTIONS.md</code> in your project root
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={checkHealth} className="bg-blue-500 hover:bg-blue-600 text-white">
              Refresh Status
            </Button>
            {health.status === 'ready' && (
              <Button
                onClick={() => (window.location.href = '/mentor/availability')}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Go to Availability Calendar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function CheckItem({
  label,
  status,
  description,
}: {
  label: string
  status: boolean
  description: string
}) {
  return (
    <div className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-[#333333] dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Badge
        className={
          status
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }
      >
        {status ? '✓ Pass' : '✗ Fail'}
      </Badge>
    </div>
  )
}
