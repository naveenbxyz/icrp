import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  ListTodo,
  Network,
  RefreshCw,
  Scale,
  Send,
  Target,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { clientsApi, onboardingApi, regulatoryApi } from '../lib/api.ts'
import type {
  Client,
  DataQualityResult,
  OnboardingStage,
  RegimeEligibility,
  RegulatoryClassification,
  RiskScore,
} from '../types/index.ts'

import RegulatoryClassificationCard from '../components/RegulatoryClassificationCard.tsx'
import RiskBadge from '../components/RiskBadge.tsx'
import DocumentRequirementsTab from '../components/DocumentRequirementsTab.tsx'

import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge, type BadgeProps } from '../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { StatusBadge } from '../components/dashboard/StatusBadge'
import { cn } from '../lib/utils'

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup',
] as const

type TabId = 'overview' | 'regulatory' | 'documents' | 'tasks'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'regulatory', label: 'Regulatory Due Diligence', icon: FileCheck },
  { id: 'documents', label: 'Document Requirements', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
]

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

function formatStatusLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function docStatusToSubtleVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'compliant':
      return 'subtle-success'
    case 'missing':
      return 'subtle-destructive'
    case 'expired':
      return 'subtle-warning'
    case 'pending_review':
      return 'subtle-primary'
    default:
      return 'subtle-default'
  }
}

// -------------------------------------------------------------
// Document Requirements Lane (Overview tab, right column)
// -------------------------------------------------------------

function DocumentRequirementsLane({ clientId }: { clientId: string | undefined }) {
  const [requirements, setRequirements] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    setLoading(true)
    fetch(`http://localhost:8000/api/clients/${clientId}/document-requirements`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setRequirements(data)
      })
      .catch((err) => console.error('Failed to fetch document requirements', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  if (loading) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Loading requirements…
      </div>
    )
  }

  if (!requirements || !requirements.regimes || requirements.regimes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No requirements yet
      </div>
    )
  }

  const summary = requirements.summary
  const pct: number = summary.compliance_percentage
  const pctTone =
    pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Overall compliance
          </div>
          <div className={cn('text-lg font-semibold tabular-nums', pctTone)}>
            {pct}%
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border">
          <MiniStat label="Compliant" value={summary.compliant_count} tone="success" />
          <MiniStat label="Missing" value={summary.missing_count} tone="destructive" />
          <MiniStat label="Expired" value={summary.expired_count} tone="warning" />
          <MiniStat
            label="Pending review"
            value={summary.pending_review_count}
            tone="primary"
          />
        </div>
      </Card>

      {requirements.regimes.map((regime: any) => (
        <Card key={regime.regime} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">{regime.regime}</div>
            <div className="text-xs text-muted-foreground">
              {regime.compliant_count}/{regime.total_requirements} compliant
              {regime.missing_count > 0 && (
                <span className="ml-2 font-semibold text-destructive">
                  • {regime.missing_count} missing
                </span>
              )}
            </div>
          </div>
          <ul className="space-y-1.5">
            {regime.requirements.slice(0, 3).map((req: any) => (
              <li key={req.id} className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                    req.status === 'compliant' && 'bg-success',
                    req.status === 'missing' && 'bg-destructive',
                    req.status === 'expired' && 'bg-warning',
                    req.status === 'pending_review' && 'bg-primary',
                  )}
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {req.evidence_name}
                </span>
                <Badge variant={docStatusToSubtleVariant(req.status)}>
                  {formatStatusLabel(req.status)}
                </Badge>
              </li>
            ))}
            {regime.requirements.length > 3 && (
              <li className="pt-1 text-[11px] text-muted-foreground">
                +{regime.requirements.length - 3} more requirements
              </li>
            )}
          </ul>
        </Card>
      ))}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'destructive' | 'warning' | 'primary'
}) {
  const toneClass = {
    success: 'text-success',
    destructive: 'text-destructive',
    warning: 'text-warning',
    primary: 'text-primary',
  }[tone]
  return (
    <div className="px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-0.5 text-lg font-semibold tabular-nums', toneClass)}>
        {value}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Simulate External Trigger — button + progress modal
// -------------------------------------------------------------

function SimulateExternalTriggerButton({
  stages,
  clientId,
  onTriggerComplete,
}: {
  stages: OnboardingStage[]
  clientId: number
  onTriggerComplete: () => void
}) {
  const [isTriggering, setIsTriggering] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    regime: string
  }>({ current: 0, total: 20, regime: '' })

  const legalEntity = stages.find((s) => s.stage_name === 'Legal Entity Setup')
  const regClassification = stages.find(
    (s) => s.stage_name === 'Regulatory Classification',
  )
  const shouldShow =
    legalEntity?.status === 'completed' && regClassification?.status === 'not_started'

  if (!shouldShow) return null

  const handleTrigger = async () => {
    setIsTriggering(true)
    setShowModal(true)
    setProgress({ current: 0, total: 20, regime: 'Initializing…' })

    try {
      const regimesRes = await fetch('http://localhost:8000/api/regimes')
      const allRegimes: string[] = await regimesRes.json()

      for (let i = 0; i < allRegimes.length; i++) {
        const regime = allRegimes[i]
        setProgress({ current: i + 1, total: allRegimes.length, regime })
        await fetch(
          `http://localhost:8000/api/clients/${clientId}/evaluate-eligibility?regime=${encodeURIComponent(regime)}`,
          { method: 'POST' },
        )
        await new Promise((r) => setTimeout(r, 300))
      }

      const regStageRes = await fetch(
        `http://localhost:8000/api/clients/${clientId}/onboarding`,
      )
      const allStages: OnboardingStage[] = await regStageRes.json()
      const regStage = allStages.find(
        (s) => s.stage_name === 'Regulatory Classification',
      )
      if (regStage) {
        await fetch(`http://localhost:8000/api/onboarding/${regStage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        })
      }

      setProgress({ current: allRegimes.length, total: allRegimes.length, regime: 'Complete' })
      await new Promise((r) => setTimeout(r, 800))
      setShowModal(false)
      onTriggerComplete()
    } catch (err) {
      console.error('Failed to trigger regime evaluation', err)
      setProgress((p) => ({ ...p, regime: 'Error occurred' }))
    } finally {
      setIsTriggering(false)
    }
  }

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <>
      <Button onClick={handleTrigger} disabled={isTriggering} size="sm">
        <RefreshCw className={cn('h-4 w-4', isTriggering && 'animate-spin')} />
        Simulate external trigger
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-[min(92vw,480px)] p-6 shadow-lg">
            <div className="mb-1 text-base font-semibold">
              Evaluating regime eligibility
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Running classification rules across all configured regimes.
            </p>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono font-medium text-foreground">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Currently evaluating
              </div>
              <div className="text-sm font-medium text-foreground">
                {progress.regime || '—'}
              </div>
            </div>

            {progress.current === progress.total && progress.current > 0 && (
              <Alert variant="success" className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>All regimes evaluated</AlertTitle>
              </Alert>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

// -------------------------------------------------------------
// Stage cell (Overview timeline)
// -------------------------------------------------------------

function StageCell({
  stage,
  name,
}: {
  stage: OnboardingStage | undefined
  name: string
}) {
  const status = stage?.status ?? 'not_started'
  const active = status === 'in_progress'
  const overdue = stage?.is_overdue ?? false

  let dotCls = 'border border-border bg-muted text-muted-foreground'
  let Icon: LucideIcon | null = null
  if (status === 'completed') {
    dotCls = 'bg-success text-success-foreground'
    Icon = Check
  } else if (status === 'blocked') {
    dotCls = 'bg-destructive text-destructive-foreground'
    Icon = Ban
  } else if (active) {
    dotCls = overdue
      ? 'bg-destructive/10 text-destructive ring-4 ring-destructive/15'
      : 'bg-primary/10 text-primary ring-4 ring-primary/15'
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={cn(
          'z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors',
          dotCls,
        )}
      >
        {Icon ? (
          <Icon className="h-4 w-4" />
        ) : active ? (
          <span className="h-2 w-2 rounded-full bg-primary" />
        ) : null}
      </div>
      <div
        className={cn(
          'mt-3 text-xs font-medium leading-tight',
          status === 'not_started' ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {name}
      </div>
      {stage?.tat_days !== null && stage?.tat_days !== undefined && (
        <Badge
          variant={overdue ? 'subtle-destructive' : 'subtle-success'}
          className="mt-2"
        >
          {stage.tat_days}d
        </Badge>
      )}
      {stage?.target_tat_hours != null && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Target {(stage.target_tat_hours / 24).toFixed(1)}d
        </div>
      )}
      {stage?.assigned_team && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {stage.assigned_team}
        </div>
      )}
      {stage?.notes && (
        <div className="mt-1 text-[10px] italic text-destructive">{stage.notes}</div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Main component
// -------------------------------------------------------------

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [client, setClient] = useState<Client | null>(null)
  const [stages, setStages] = useState<OnboardingStage[]>([])
  const [classifications, setClassifications] = useState<RegulatoryClassification[]>([])
  const [eligibilities, setEligibilities] = useState<RegimeEligibility[]>([])
  const [dataQuality, setDataQuality] = useState<Record<string, DataQualityResult>>({})
  const [regimes, setRegimes] = useState<string[]>([])
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLegacyExpanded, setIsLegacyExpanded] = useState(false)

  const [cxSyncStatus, setCxSyncStatus] = useState<any>(null)
  const [publishingToCX, setPublishingToCX] = useState(false)
  const [documentRequirements, setDocumentRequirements] = useState<any>(null)

  useEffect(() => {
    if (!clientId) return
    const load = async () => {
      try {
        setLoading(true)

        const regimesRes = await fetch('http://localhost:8000/api/regimes')
        setRegimes(await regimesRes.json())

        const [clientData, stagesData, classificationsData, riskScoreData] =
          await Promise.all([
            clientsApi.getById(Number(clientId)),
            onboardingApi.getStages(Number(clientId)),
            regulatoryApi.getClassifications(Number(clientId)),
            clientsApi.getRiskScore(Number(clientId)),
          ])
        setClient(clientData)
        setStages(stagesData)
        setClassifications(classificationsData)
        setRiskScore(riskScoreData)

        const eligRes = await fetch(
          `http://localhost:8000/api/clients/${clientId}/regime-eligibility`,
        )
        const eligData: RegimeEligibility[] = await eligRes.json()
        setEligibilities(eligData)

        const qualityMap: Record<string, DataQualityResult> = {}
        for (const elig of eligData) {
          try {
            const qualityRes = await fetch(
              `http://localhost:8000/api/clients/${clientId}/data-quality?regime=${elig.regime}`,
            )
            qualityMap[`${clientId}_${elig.regime}`] = await qualityRes.json()
          } catch (err) {
            console.error(`Failed to fetch data quality for ${elig.regime}`, err)
          }
        }
        setDataQuality(qualityMap)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  const handleEvaluateRegime = async (regime: string) => {
    setEvaluating(regime)
    try {
      await fetch(
        `http://localhost:8000/api/clients/${clientId}/evaluate-eligibility?regime=${regime}`,
        { method: 'POST' },
      )
      const eligRes = await fetch(
        `http://localhost:8000/api/clients/${clientId}/regime-eligibility`,
      )
      setEligibilities(await eligRes.json())
    } catch (err) {
      console.error('Failed to evaluate regime', err)
    } finally {
      setEvaluating(null)
    }
  }

  const handleSimulateCXApproval = async () => {
    if (!client) return
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/api/clients/${client.id}/simulate-cx-approval`,
        { method: 'POST' },
      )
      const result = await response.json()
      alert(
        `Client Central Product Approval Simulated!\n\n` +
          `Product Approved: ${result.product_approved}\n` +
          `Regimes Evaluated: ${result.regimes_evaluated}\n` +
          `Eligible Regimes: ${result.eligible_regimes.length}`,
      )
      if (clientId) {
        const [clientData, stagesData, eligData] = await Promise.all([
          clientsApi.getById(Number(clientId)),
          onboardingApi.getStages(Number(clientId)),
          fetch(`http://localhost:8000/api/clients/${clientId}/regime-eligibility`).then(
            (r) => r.json(),
          ),
        ])
        setClient(clientData)
        setStages(stagesData)
        setEligibilities(eligData)
      }
    } catch (err) {
      console.error('Failed to simulate Client Central approval:', err)
      alert('Failed to simulate Client Central product approval')
    } finally {
      setLoading(false)
    }
  }

  const fetchCXSyncStatus = async () => {
    if (!clientId) return
    try {
      const r = await fetch(`http://localhost:8000/api/clients/${clientId}/cx-sync-status`)
      setCxSyncStatus(await r.json())
    } catch (err) {
      console.error('Failed to fetch Client Central sync status:', err)
    }
  }

  const handlePublishToCX = async () => {
    if (!clientId) return
    setPublishingToCX(true)
    try {
      const r = await fetch(
        `http://localhost:8000/api/clients/${clientId}/publish-classification-to-cx`,
        { method: 'POST' },
      )
      const result = await r.json()
      alert(
        `Classification Published to Client Central Successfully!\n\n` +
          `Client Central Reference ID: ${result.cx_reference_id}\n` +
          `Regimes Published: ${result.regimes_published}\n` +
          `Data Quality Warnings: ${result.data_quality_warnings.length}`,
      )
      await fetchCXSyncStatus()
    } catch (err) {
      console.error('Failed to publish to Client Central:', err)
      alert('Failed to publish classification to Client Central')
    } finally {
      setPublishingToCX(false)
    }
  }

  const fetchDocumentRequirements = async () => {
    if (!clientId) return
    try {
      const r = await fetch(
        `http://localhost:8000/api/clients/${clientId}/document-requirements`,
      )
      setDocumentRequirements(await r.json())
    } catch (err) {
      console.error('Failed to fetch document requirements:', err)
    }
  }

  useEffect(() => {
    if ((activeTab === 'regulatory' || activeTab === 'documents') && clientId) {
      fetchCXSyncStatus()
      fetchDocumentRequirements()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clientId])

  const getTabBadge = (tabId: TabId): string | null => {
    switch (tabId) {
      case 'regulatory': {
        const totalItems = eligibilities.length + classifications.length
        if (totalItems === 0) return null
        const eligibleCount = eligibilities.filter((e) => e.is_eligible).length
        return String(eligibleCount + classifications.length)
      }
      case 'documents': {
        let missingCount = 0
        Object.values(dataQuality).forEach((q) => {
          if (q.missing_evidences) missingCount += q.missing_evidences.length
        })
        return missingCount > 0 ? `${missingCount} missing` : null
      }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading client details…
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-sm text-destructive">
          Error: {error || 'Client not found'}
        </div>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6 lg:px-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>
      </div>

      <ClientHeader client={client} riskScore={riskScore} />

      <div className="border-b border-border">
        <div className="-mb-px flex flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const badge = getTabBadge(tab.id)
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {badge && (
                  <Badge variant={active ? 'subtle-primary' : 'subtle-default'}>
                    {badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            client={client}
            stages={stages}
            classifications={classifications}
            eligibilities={eligibilities}
            regimes={regimes}
            clientId={clientId}
            dataQuality={dataQuality}
            loading={loading}
            onSimulateCXApproval={handleSimulateCXApproval}
            onViewRegulatory={() => setActiveTab('regulatory')}
            onRefreshStages={() => {
              if (!clientId) return
              Promise.all([
                onboardingApi.getStages(Number(clientId)),
                fetch(
                  `http://localhost:8000/api/clients/${clientId}/regime-eligibility`,
                ).then((r) => r.json()),
              ]).then(([stagesData, eligData]) => {
                setStages(stagesData)
                setEligibilities(eligData)
              })
            }}
          />
        )}

        {activeTab === 'regulatory' && (
          <RegulatoryTab
            classifications={classifications}
            eligibilities={eligibilities}
            dataQuality={dataQuality}
            evaluating={evaluating}
            isLegacyExpanded={isLegacyExpanded}
            setIsLegacyExpanded={setIsLegacyExpanded}
            onEvaluate={handleEvaluateRegime}
            onPublishToCX={handlePublishToCX}
            cxSyncStatus={cxSyncStatus}
            publishingToCX={publishingToCX}
            documentRequirements={documentRequirements}
            clientIdStr={String(clientId)}
          />
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {documentRequirements?.summary && (
              <DocumentValidationSummary summary={documentRequirements.summary} />
            )}
            <DocumentRequirementsTab
              clientId={Number(clientId)}
              clientName={client.name}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card className="py-16">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <div className="text-base font-medium text-foreground">
                Tasks &amp; activities
              </div>
              <p className="text-sm text-muted-foreground">
                Task tracking and activity log will be available here.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Client header
// -------------------------------------------------------------

function ClientHeader({
  client,
  riskScore,
}: {
  client: Client
  riskScore: RiskScore | null
}) {
  return (
    <header className="pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {client.name}
        </h1>
        <StatusBadge status={client.onboarding_status} type="onboarding" />
        {riskScore && <RiskBadge riskScore={riskScore} size="small" />}
      </div>

      {riskScore && riskScore.risk_factors.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Risk factors:</span>{' '}
          {riskScore.risk_factors.join(', ')}
        </p>
      )}

      <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs">
        <div>
          <dt className="inline font-medium text-foreground">Entity ID: </dt>
          <dd className="inline font-mono text-muted-foreground">
            {client.legal_entity_id}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Country: </dt>
          <dd className="inline text-muted-foreground">
            {client.country_of_incorporation}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Entity Type: </dt>
          <dd className="inline text-muted-foreground">{client.entity_type}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">RM: </dt>
          <dd className="inline text-muted-foreground">{client.assigned_rm}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-md border border-border bg-muted/30 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <KeyAttr label="Product" value={client.client_attributes?.product} />
        <KeyAttr
          label="Booking Location"
          value={client.client_attributes?.booking_location}
        />
        <KeyAttr label="Country of Incorporation" value={client.country_of_incorporation} />
      </div>
    </header>
  )
}

function KeyAttr({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">
        {value || 'Not specified'}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Overview tab
// -------------------------------------------------------------

interface OverviewTabProps {
  client: Client
  stages: OnboardingStage[]
  classifications: RegulatoryClassification[]
  eligibilities: RegimeEligibility[]
  regimes: string[]
  clientId: string | undefined
  dataQuality: Record<string, DataQualityResult>
  loading: boolean
  onSimulateCXApproval: () => void
  onViewRegulatory: () => void
  onRefreshStages: () => void
}

function OverviewTab({
  client,
  stages,
  classifications,
  eligibilities,
  regimes,
  clientId,
  dataQuality,
  loading,
  onSimulateCXApproval,
  onViewRegulatory,
  onRefreshStages,
}: OverviewTabProps) {
  const attrs = client.client_attributes ?? {}
  const hasMaterialChange = Boolean(attrs.country_change_date)
  const showCXApprovalPrompt =
    client.onboarding_status === 'in_progress' &&
    stages.some(
      (s) => s.stage_name === 'Legal Entity Setup' && s.status === 'in_progress',
    )

  // Data quality summary
  let totalWarnings = 0
  let criticalWarnings = 0
  let regimesWithWarnings = 0
  eligibilities.forEach((elig) => {
    const q = dataQuality[`${clientId}_${elig.regime}`]
    if (q && q.warnings && q.warnings.length > 0) {
      totalWarnings += q.warnings.length
      regimesWithWarnings++
      criticalWarnings += q.warnings.filter((w) =>
        /missing|expired/i.test(w),
      ).length
    }
  })

  return (
    <div className="space-y-6">
      {/* Onboarding progress */}
      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Onboarding progress
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stage-by-stage view of the client onboarding pipeline.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {client.cumulative_tat_days != null && (
              <div className="text-right">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Cumulative TAT
                </div>
                <div className="text-lg font-semibold text-success">
                  {client.cumulative_tat_days}d
                </div>
                {client.cumulative_tat_hours != null && (
                  <div className="text-[10px] text-muted-foreground">
                    {client.cumulative_tat_hours.toFixed(1)}h
                  </div>
                )}
              </div>
            )}
            <SimulateExternalTriggerButton
              stages={stages}
              clientId={Number(clientId)}
              onTriggerComplete={onRefreshStages}
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 right-4 top-[18px] h-px bg-border" />
          <div className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {STAGES.map((name) => (
              <StageCell
                key={name}
                name={name}
                stage={stages.find((s) => s.stage_name === name)}
              />
            ))}
          </div>
        </div>

        {hasMaterialChange && (
          <Alert variant="warning" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Material change detected</AlertTitle>
            <AlertDescription className="mt-2 space-y-1 text-xs">
              <div>
                <span className="font-medium">Country of incorporation changed:</span>{' '}
                {attrs.previous_country_of_incorporation} → {client.country_of_incorporation}
              </div>
              <div>
                <span className="font-medium">Change date:</span>{' '}
                {new Date(attrs.country_change_date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Reason:</span>{' '}
                {attrs.change_reason || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">Impact:</span> Periodic review triggered —
                classification needs re-evaluation for new jurisdiction-specific regimes.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showCXApprovalPrompt && (
          <Alert variant="info" className="mt-6">
            <Send className="h-4 w-4" />
            <AlertTitle>Client Central product approval required</AlertTitle>
            <AlertDescription className="mt-2 text-xs">
              Simulate product approval from Client Central to trigger regulatory
              classification across {regimes.length}+ regimes.
              <div className="mt-3">
                <Button size="sm" onClick={onSimulateCXApproval} disabled={loading}>
                  {loading ? 'Processing…' : 'Simulate Client Central approval'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Regulatory overview — two lanes */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Regulatory classifications
              </h2>
            </div>

            {classifications.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <div>No manual classifications</div>
                {eligibilities.length > 0 && (
                  <div className="mt-2 text-xs text-success">
                    {eligibilities.filter((e) => e.is_eligible).length} regime
                    {eligibilities.filter((e) => e.is_eligible).length !== 1 ? 's' : ''}{' '}
                    evaluated via rule engine (see below)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {classifications.map((c) => (
                  <RegulatoryClassificationCard key={c.id} classification={c} />
                ))}
              </div>
            )}

            {eligibilities.length > 0 && (
              <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
                <div className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Regime assessment summary
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Evaluated:</span>{' '}
                    {eligibilities.length} of {regimes.length} regulatory regimes
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Eligible:</span>{' '}
                    {eligibilities.filter((e) => e.is_eligible).length} regime
                    {eligibilities.filter((e) => e.is_eligible).length !== 1 ? 's' : ''}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Legacy:</span>{' '}
                    {classifications.length} framework
                    {classifications.length !== 1 ? 's' : ''}
                  </li>
                </ul>
                <p className="mt-2 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
                  All {regimes.length} regimes are assessed. Only applicable regimes
                  result in classifications.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Documentation requirements
              </h2>
            </div>
            <DocumentRequirementsLane clientId={clientId} />
          </div>
        </div>

        {totalWarnings > 0 && (
          <Alert
            variant={criticalWarnings > 0 ? 'destructive' : 'warning'}
            className="mt-6 flex items-center justify-between"
          >
            <AlertTriangle className="h-4 w-4" />
            <div className="flex-1 pl-7">
              <AlertTitle>
                {criticalWarnings > 0
                  ? `${criticalWarnings} critical warning${criticalWarnings !== 1 ? 's' : ''}`
                  : 'Data quality alerts'}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {totalWarnings} total warning{totalWarnings !== 1 ? 's' : ''} across{' '}
                {regimesWithWarnings} regime{regimesWithWarnings !== 1 ? 's' : ''}
              </AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onViewRegulatory}>
              View details
            </Button>
          </Alert>
        )}

        {client.client_attributes && (
          <ClientAttributesSection attrs={client.client_attributes} />
        )}
      </Card>
    </div>
  )
}

function ClientAttributesSection({ attrs }: { attrs: Client['client_attributes'] }) {
  const a = attrs ?? {}
  const grid = a.product_grid
  return (
    <div className="mt-6 rounded-md border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Network className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Client attributes</h3>
        <Badge variant="subtle-default" className="ml-1">
          Used for rule evaluation
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Basic attributes
          </div>
          <div className="space-y-2">
            {a.account_type && (
              <AttrRow label="Account type" value={a.account_type} />
            )}
            {a.booking_location && (
              <AttrRow label="Booking location" value={a.booking_location} />
            )}
            {!a.account_type && !a.booking_location && (
              <div className="text-xs italic text-muted-foreground">None set</div>
            )}
          </div>
        </div>

        {grid && (
          <div className="rounded-md border border-border bg-card p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Product grid
            </div>
            <div className="space-y-2">
              {grid.product_group && <AttrRow label="Group" value={grid.product_group} />}
              {grid.product_category && (
                <AttrRow label="Category" value={grid.product_category} />
              )}
              {grid.product_type && <AttrRow label="Type" value={grid.product_type} />}
              {grid.product_status && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      grid.product_status === 'approved'
                        ? 'subtle-success'
                        : 'subtle-destructive'
                    }
                  >
                    {formatStatusLabel(grid.product_status)}
                  </Badge>
                </div>
              )}
              {grid.bank_entity && <AttrRow label="Bank entity" value={grid.bank_entity} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AttrRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground">
        {value}
      </span>
    </div>
  )
}

// -------------------------------------------------------------
// Regulatory tab
// -------------------------------------------------------------

interface RegulatoryTabProps {
  classifications: RegulatoryClassification[]
  eligibilities: RegimeEligibility[]
  dataQuality: Record<string, DataQualityResult>
  evaluating: string | null
  isLegacyExpanded: boolean
  setIsLegacyExpanded: (v: boolean) => void
  onEvaluate: (regime: string) => void
  onPublishToCX: () => void
  cxSyncStatus: any
  publishingToCX: boolean
  documentRequirements: any
  clientIdStr: string
}

function RegulatoryTab({
  classifications,
  eligibilities,
  dataQuality,
  evaluating,
  isLegacyExpanded,
  setIsLegacyExpanded,
  onEvaluate,
  onPublishToCX,
  cxSyncStatus,
  publishingToCX,
  documentRequirements,
  clientIdStr,
}: RegulatoryTabProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-foreground">
            Regulatory due diligence
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Evaluate regime eligibility and monitor mandatory evidence completeness.
          </p>
        </div>

        <Alert variant="info" className="mb-6">
          <Network className="h-4 w-4" />
          <AlertTitle>External rule engine integration</AlertTitle>
          <AlertDescription className="text-xs">
            Classification rules are executed in <strong>Droit Platform</strong> and
            results are synchronized to this system. Changes in client attributes or
            rules trigger automatic re-evaluation.
          </AlertDescription>
        </Alert>

        {classifications.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setIsLegacyExpanded(!isLegacyExpanded)}
              className="flex w-full items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Classification history
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {classifications.length} historical classification
                    {classifications.length !== 1 ? 's' : ''} (pre-automation)
                  </div>
                </div>
                <Badge variant="subtle-default">Audit only</Badge>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  isLegacyExpanded && 'rotate-180',
                )}
              />
            </button>

            {isLegacyExpanded && (
              <div className="mt-3 space-y-3 rounded-md border border-border bg-muted/20 p-4">
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    These are historical classifications assigned before the automated
                    rule engine. Maintained for audit only. Current authoritative
                    assessments are below.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {classifications.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">
                            {c.framework}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Classification:
                            </span>{' '}
                            {c.classification}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Classified:
                            </span>{' '}
                            {new Date(c.classification_date).toLocaleDateString()}
                          </div>
                          {c.validation_notes && (
                            <p className="mt-2 text-xs italic text-muted-foreground">
                              “{c.validation_notes}”
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={c.validation_status}
                          type="validation"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {eligibilities.length === 0 && classifications.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-12 text-center">
            <FileCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              No regime evaluations yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Regime eligibility evaluations will appear here once processed.
            </p>
          </div>
        ) : eligibilities.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Regime eligibility results
              </h3>
              <Badge variant="subtle-success">
                {eligibilities.filter((e) => e.is_eligible).length} eligible
              </Badge>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Automated evaluation based on configured classification rules and client
              attributes.
            </p>

            <div className="space-y-4">
              {eligibilities.map((elig) => (
                <RegimeCard
                  key={elig.id}
                  elig={elig}
                  quality={dataQuality[`${clientIdStr}_${elig.regime}`]}
                  evaluating={evaluating === elig.regime}
                  onEvaluate={() => onEvaluate(elig.regime)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Client Central publication */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Client Central integration
          </h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Publish classification results to Client Central for downstream processing.
        </p>

        {cxSyncStatus && (
          <div className="mb-4">
            {cxSyncStatus.cx_sync_status === 'synced' ? (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Classification published to Client Central</AlertTitle>
                <AlertDescription className="mt-1 space-y-0.5 text-xs">
                  <div>
                    Last synced:{' '}
                    {new Date(cxSyncStatus.cx_sync_date).toLocaleString()}
                  </div>
                  <div>
                    Reference ID:{' '}
                    <span className="font-mono font-medium">
                      {cxSyncStatus.cx_reference_id}
                    </span>
                  </div>
                  <div>Regimes classified: {cxSyncStatus.regimes_classified}</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Classification not yet published</AlertTitle>
                <AlertDescription className="text-xs">
                  Classification results are available but have not been sent to Client
                  Central.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {eligibilities.length > 0 && (
          <div className="space-y-3">
            {documentRequirements?.summary &&
              documentRequirements.summary.compliance_percentage < 90 && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Classification will be published with document compliance
                    exceptions flagged for review (compliance:{' '}
                    {documentRequirements.summary.compliance_percentage.toFixed(0)}%).
                  </AlertDescription>
                </Alert>
              )}

            <Button onClick={onPublishToCX} disabled={publishingToCX}>
              {publishingToCX ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Publishing to Client Central…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {cxSyncStatus?.cx_sync_status === 'synced'
                    ? 'Re-publish to Client Central'
                    : 'Publish to Client Central'}
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

function RegimeCard({
  elig,
  quality,
  evaluating,
  onEvaluate,
}: {
  elig: RegimeEligibility
  quality: DataQualityResult | undefined
  evaluating: boolean
  onEvaluate: () => void
}) {
  const attrs = elig.client_attributes ?? {}
  const grid = attrs.product_grid ?? {}

  const attrRows: Array<{ label: string; value: string | undefined }> = [
    { label: 'Account type', value: attrs.account_type },
    { label: 'Booking location', value: attrs.booking_location },
    { label: 'Product group', value: grid.product_group },
    { label: 'Product category', value: grid.product_category },
    { label: 'Product type', value: grid.product_type },
    { label: 'Product status', value: grid.product_status },
    { label: 'Bank entity', value: grid.bank_entity },
  ].filter((r) => r.value)

  const qualityVariant: BadgeProps['variant'] = quality
    ? quality.quality_score >= 80
      ? 'subtle-success'
      : quality.quality_score >= 50
        ? 'subtle-warning'
        : 'subtle-destructive'
    : 'subtle-default'

  return (
    <div
      className={cn(
        'rounded-lg border p-5',
        elig.is_eligible
          ? 'border-success/40 bg-success/5'
          : 'border-border bg-muted/30',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              {elig.regime} regime
            </h4>
            <Badge
              variant={elig.is_eligible ? 'subtle-success' : 'subtle-destructive'}
            >
              {elig.is_eligible ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Eligible
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" />
                  Not eligible
                </>
              )}
            </Badge>
            {quality && (
              <Badge variant={qualityVariant}>
                {quality.quality_score.toFixed(0)}% complete
              </Badge>
            )}
          </div>

          {elig.eligibility_reason && (
            <p className="mt-2 text-xs text-muted-foreground">
              {elig.eligibility_reason}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEvaluate}
          disabled={evaluating}
        >
          <RefreshCw className={cn('h-4 w-4', evaluating && 'animate-spin')} />
          Re-evaluate
        </Button>
      </div>

      {attrRows.length > 0 && (
        <div className="mt-4 rounded-md border border-border bg-card p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Evaluated attributes
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attrRows.map((r) => (
              <div key={r.label} className="text-xs">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {r.label}
                </div>
                <div className="truncate font-medium text-foreground">
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          'mt-4 grid grid-cols-1 gap-3',
          elig.unmatched_rules && elig.unmatched_rules.length > 0 && 'lg:grid-cols-2',
        )}
      >
        <div className="rounded-md border border-success/40 bg-card p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Matched rules ({elig.matched_rules?.length ?? 0})
          </div>
          {elig.matched_rules && elig.matched_rules.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-foreground">
              {elig.matched_rules.map((rule, idx) => (
                <li key={idx}>
                  <div className="font-medium">{rule.rule_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Type: {rule.rule_type}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs italic text-muted-foreground">
              No rules matched
            </div>
          )}
        </div>

        {elig.unmatched_rules && elig.unmatched_rules.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Unmatched rules ({elig.unmatched_rules.length})
            </div>
            <div className="space-y-2">
              {elig.unmatched_rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="rounded-sm border border-border bg-muted/40 p-2 text-xs"
                >
                  <div className="font-medium text-foreground">{rule.rule_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Type: {rule.rule_type}
                  </div>
                  <div className="mt-1.5 space-y-1">
                    <div className="rounded-sm bg-warning/10 px-1.5 py-1 text-[11px]">
                      <span className="font-semibold text-warning">Expected: </span>
                      <span className="font-mono text-foreground">
                        {JSON.stringify(rule.expected)}
                      </span>
                    </div>
                    <div className="rounded-sm bg-destructive/10 px-1.5 py-1 text-[11px]">
                      <span className="font-semibold text-destructive">Actual: </span>
                      <span className="font-mono text-foreground">
                        {JSON.stringify(rule.actual)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {quality && quality.warnings.length > 0 && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data quality warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              {quality.warnings.slice(0, 3).map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
              {quality.warnings.length > 3 && (
                <li className="font-medium">
                  …and {quality.warnings.length - 3} more
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Documents tab — validation summary
// -------------------------------------------------------------

function DocumentValidationSummary({ summary }: { summary: any }) {
  const pct: number = summary.compliance_percentage
  const tone =
    pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'
  const statusLabel = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Good' : 'Needs attention'

  const tiles: Array<{ label: string; value: ReactNode; className?: string }> = [
    { label: 'Overall status', value: <span className={cn('text-base', tone)}>{statusLabel}</span> },
    { label: 'Total requirements', value: summary.total_requirements },
    { label: 'Compliant', value: summary.compliant_count, className: 'text-success' },
    { label: 'Missing', value: summary.missing_count, className: 'text-destructive' },
    { label: 'Expired', value: summary.expired_count, className: 'text-warning' },
    { label: 'Compliance', value: `${pct.toFixed(0)}%`, className: tone },
    {
      label: 'Can publish to CX',
      value: (
        <span className="inline-flex items-center gap-1 text-base text-success">
          <CheckCircle2 className="h-4 w-4" />
          Yes
        </span>
      ),
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-base font-semibold text-foreground">
        Document validation summary
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {tiles.map((t) => (
          <Fragment key={t.label}>
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t.label}
              </div>
              <div
                className={cn(
                  'mt-1 text-xl font-semibold tabular-nums',
                  t.className,
                )}
              >
                {t.value}
              </div>
            </div>
          </Fragment>
        ))}
      </div>

      {(summary.missing_count > 0 || summary.expired_count > 0) && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Issues found</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc text-xs">
              {summary.missing_count > 0 && (
                <li>
                  {summary.missing_count} missing document
                  {summary.missing_count > 1 ? 's' : ''} require
                  {summary.missing_count === 1 ? 's' : ''} attention
                </li>
              )}
              {summary.expired_count > 0 && (
                <li>
                  {summary.expired_count} expired document
                  {summary.expired_count > 1 ? 's need' : ' needs'} renewal
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
