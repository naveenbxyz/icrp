import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertOctagon,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { StatusBadge } from '../components/dashboard/StatusBadge'
import { cn } from '../lib/utils'

interface Client {
  id: number
  name: string
  legal_entity_id: string
  country_of_incorporation: string
  entity_type: string
  onboarding_status: string
  assigned_rm: string
  current_stage: string | null
  cumulative_tat_days?: number | null
  cumulative_tat_hours?: number | null
}

interface OnboardingStage {
  id: number
  stage_name: string
  status: string
  order: number
  tat_days?: number | null
  target_tat_hours?: number | null
  is_overdue?: boolean | null
}

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup',
] as const

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

export default function Dashboard() {
  const navigate = useNavigate()
  const [allClients, setAllClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedClient, setExpandedClient] = useState<number | null>(null)
  const [clientStages, setClientStages] = useState<
    Record<number, OnboardingStage[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/clients')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        setAllClients(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return allClients.filter((client) => {
      if (statusFilter !== 'all' && client.onboarding_status !== statusFilter) {
        return false
      }
      if (!term) return true
      return (
        client.name.toLowerCase().includes(term) ||
        client.legal_entity_id.toLowerCase().includes(term) ||
        client.country_of_incorporation.toLowerCase().includes(term)
      )
    })
  }, [allClients, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: allClients.length,
      inProgress: allClients.filter((c) => c.onboarding_status === 'in_progress')
        .length,
      completed: allClients.filter((c) => c.onboarding_status === 'completed')
        .length,
      blocked: allClients.filter((c) => c.onboarding_status === 'blocked').length,
    }),
    [allClients]
  )

  const toggleClient = async (clientId: number) => {
    if (expandedClient === clientId) {
      setExpandedClient(null)
      return
    }
    setExpandedClient(clientId)
    if (!clientStages[clientId]) {
      try {
        const res = await fetch(
          `http://localhost:8000/api/clients/${clientId}/onboarding`
        )
        const stages = await res.json()
        setClientStages((prev) => ({ ...prev, [clientId]: stages }))
      } catch {
        // leave stages empty; UI shows loading placeholder
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading clients…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-destructive">
        Error: {error}
      </div>
    )
  }

  const pct = (part: number) =>
    stats.total > 0 ? Math.round((part / stats.total) * 100) : 0

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8">
      <header className="flex flex-col gap-1 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Client Readiness
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor onboarding and regulatory due diligence across the pipeline.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated{' '}
          {new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total clients" value={stats.total} icon={Users} hint="Active pipeline" />
        <MetricCard
          label="In progress"
          value={stats.inProgress}
          icon={Clock3}
          tone="info"
          hint={`${pct(stats.inProgress)}% of total`}
        />
        <MetricCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          tone="success"
          hint={`${pct(stats.completed)}% success rate`}
        />
        <MetricCard
          label="Blocked"
          value={stats.blocked}
          icon={AlertOctagon}
          tone="destructive"
          hint="Requires attention"
        />
      </section>

      <Card className="mt-6">
        <div className="flex flex-col gap-3 border-b border-border p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by client name, entity ID, or country…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.value
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'h-7 rounded px-3 text-xs font-medium transition-colors',
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span>
            {filteredClients.length === allClients.length
              ? `${filteredClients.length} ${
                  filteredClients.length === 1 ? 'client' : 'clients'
                }`
              : `Showing ${filteredClients.length} of ${allClients.length} clients`}
          </span>
        </div>

        {filteredClients.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No clients found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Client</th>
                  <th className="px-4 py-2 font-medium">Country</th>
                  <th className="px-4 py-2 font-medium">Entity Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">RM</th>
                  <th className="w-32 px-4 py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isExpanded = expandedClient === client.id
                  const stages = clientStages[client.id] ?? []
                  return (
                    <Fragment key={client.id}>
                      <tr
                        onClick={() => toggleClient(client.id)}
                        className={cn(
                          'cursor-pointer border-b border-border transition-colors hover:bg-muted/40',
                          isExpanded && 'bg-muted/40'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {client.name}
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            {client.legal_entity_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {client.country_of_incorporation}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {client.entity_type}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={client.onboarding_status}
                            type="onboarding"
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {client.assigned_rm}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/client/${client.id}`)
                              }}
                            >
                              View
                            </Button>
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 text-muted-foreground transition-transform',
                                isExpanded && 'rotate-90'
                              )}
                            />
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-border bg-muted/20">
                          <td colSpan={6} className="px-6 py-6">
                            <OnboardingTimeline
                              client={client}
                              stages={stages}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  hint,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: 'default' | 'info' | 'success' | 'warning' | 'destructive'
  hint?: string
}) {
  const toneClass = {
    default: 'bg-muted text-muted-foreground',
    info: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  }[tone]

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md',
            toneClass
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  )
}

function OnboardingTimeline({
  client,
  stages,
}: {
  client: Client
  stages: OnboardingStage[]
}) {
  if (stages.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Loading stages…
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Onboarding Progress
        </h4>
        {client.cumulative_tat_days != null && (
          <div className="text-right">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Cumulative TAT
            </div>
            <div className="text-base font-semibold tabular-nums text-success">
              {client.cumulative_tat_days}d
            </div>
            {client.cumulative_tat_hours != null && (
              <div className="text-[10px] text-muted-foreground">
                {client.cumulative_tat_hours.toFixed(1)}h
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 right-3 top-3.5 h-px bg-border" />
        <div className="relative grid grid-cols-6 gap-2">
          {STAGES.map((name) => {
            const stage = stages.find((s) => s.stage_name === name)
            const status = (stage?.status ?? 'not_started') as
              | 'completed'
              | 'in_progress'
              | 'blocked'
              | 'not_started'
            const isOverdue = stage?.is_overdue ?? false

            const dotClass = {
              completed: 'bg-success text-success-foreground',
              in_progress:
                'bg-primary text-primary-foreground ring-4 ring-primary/15',
              blocked: 'bg-destructive text-destructive-foreground',
              not_started: 'bg-background text-muted-foreground border border-border',
            }[status]

            const DotIcon: LucideIcon | null = {
              completed: Check,
              in_progress: null,
              blocked: Ban,
              not_started: null,
            }[status] as LucideIcon | null

            return (
              <div key={name} className="text-center">
                <div
                  className={cn(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    dotClass,
                    isOverdue && 'ring-2 ring-destructive/40'
                  )}
                >
                  {DotIcon ? (
                    <DotIcon className="h-3.5 w-3.5" />
                  ) : status === 'in_progress' ? (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  ) : null}
                </div>
                <div
                  className={cn(
                    'mt-2 text-[11px] leading-tight',
                    status === 'not_started'
                      ? 'text-muted-foreground'
                      : 'font-medium text-foreground'
                  )}
                >
                  {name}
                </div>
                {stage?.tat_days != null && (
                  <div className="mt-1.5">
                    <Badge
                      variant={
                        isOverdue ? 'subtle-destructive' : 'subtle-success'
                      }
                    >
                      {stage.tat_days}d
                    </Badge>
                  </div>
                )}
                {stage?.target_tat_hours != null && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Target {(stage.target_tat_hours / 24).toFixed(1)}d
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <LegendDot className="bg-success" label="Completed" />
        <LegendDot className="bg-primary" label="In Progress" />
        <LegendDot className="bg-destructive" label="Blocked" />
        <LegendDot
          className="border border-border bg-background"
          label="Not Started"
        />
      </div>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2.5 w-2.5 rounded-full', className)} />
      <span>{label}</span>
    </div>
  )
}
