import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { clientsApi, onboardingApi, regulatoryApi } from '../lib/api.ts'
import type { Client, OnboardingStage, RegulatoryClassification, RegimeEligibility, DataQualityResult, RiskScore } from '../types/index.ts'
import { RegulatoryFramework } from '../types/index.ts'
import RegulatoryClassificationCard from '../components/RegulatoryClassificationCard.tsx'
import RiskBadge from '../components/RiskBadge.tsx'
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, RefreshCw, FileCheck, LayoutDashboard, Shield, FileText, ListTodo, ArrowLeft, Upload, Send } from 'lucide-react'
import DocumentRequirementsTab from '../components/DocumentRequirementsTab.tsx'

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup'
]

type TabType = 'overview' | 'regulatory' | 'documents' | 'tasks'

// Helper component for Documentation Requirements Lane
function DocumentRequirementsLane({ clientId }: { clientId: number }) {
  const [requirements, setRequirements] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/clients/${clientId}/document-requirements`)
        const data = await res.json()
        setRequirements(data)
      } catch (err) {
        console.error('Failed to fetch document requirements', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequirements()
  }, [clientId])

  if (loading) {
    return (
      <div className="text-muted-foreground" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '14px' }}>Loading requirements...</div>
      </div>
    )
  }

  if (!requirements || requirements.regimes?.length === 0) {
    return (
      <div className="text-muted-foreground" style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
        <div style={{ fontSize: '14px' }}>No requirements yet</div>
      </div>
    )
  }

  const summary = requirements.summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Summary Card */}
      <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Overall Compliance</div>
          <div className={summary.compliance_percentage >= 80 ? 'text-success' : summary.compliance_percentage >= 50 ? 'text-warning' : 'text-destructive'} style={{
            fontSize: '18px',
            fontWeight: '700'
          }}>
            {summary.compliance_percentage}%
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '11px' }}>
          <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div className="text-muted-foreground">Compliant</div>
            <div className="text-success" style={{ fontWeight: '600' }}>{summary.compliant_count}</div>
          </div>
          <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div className="text-muted-foreground">Missing</div>
            <div className="text-destructive" style={{ fontWeight: '600' }}>{summary.missing_count}</div>
          </div>
          <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div className="text-muted-foreground">Expired</div>
            <div className="text-warning" style={{ fontWeight: '600' }}>{summary.expired_count}</div>
          </div>
          <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            <div className="text-muted-foreground">Pending Review</div>
            <div className="text-info" style={{ fontWeight: '600' }}>{summary.pending_review_count}</div>
          </div>
        </div>
      </div>

      {/* Regime-specific Requirements */}
      {requirements.regimes.map((regime: any) => (
        <div key={regime.regime} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>{regime.regime}</div>
          <div className="text-muted-foreground" style={{ fontSize: '11px' }}>
            {regime.compliant_count}/{regime.total_requirements} compliant
            {regime.missing_count > 0 && (
              <span className="text-destructive" style={{ marginLeft: '8px', fontWeight: '600' }}>
                • {regime.missing_count} missing
              </span>
            )}
          </div>
          {/* Show first few requirements with status */}
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {regime.requirements.slice(0, 3).map((req: any) => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                <span className={req.status === 'compliant' ? 'bg-success' : req.status === 'missing' ? 'bg-destructive' : req.status === 'expired' ? 'bg-warning' : 'bg-info'} style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%'
                }} />
                <span className="text-muted-foreground" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.evidence_name}
                </span>
                <span className={req.status === 'compliant' ? 'bg-success/10 text-success' : req.status === 'missing' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'} style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'capitalize'
                }}>
                  {req.status}
                </span>
              </div>
            ))}
            {regime.requirements.length > 3 && (
              <div className="text-muted-foreground" style={{ fontSize: '10px', marginTop: '4px' }}>
                +{regime.requirements.length - 3} more requirements
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper component for Data Quality Warnings
function DataQualityWarnings({
  clientId,
  eligibilities,
  dataQuality
}: {
  clientId: number,
  eligibilities: RegimeEligibility[],
  dataQuality: Record<string, DataQualityResult>
}) {
  // Collect all warnings from all regimes
  const allWarnings: Array<{ regime: string; warnings: string[]; score: number }> = []

  eligibilities.forEach((elig) => {
    const quality = dataQuality[`${clientId}_${elig.regime}`]
    if (quality && quality.warnings && quality.warnings.length > 0) {
      allWarnings.push({
        regime: elig.regime,
        warnings: quality.warnings,
        score: quality.quality_score
      })
    }
  })

  if (allWarnings.length === 0) {
    return null
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#fffbeb',
      borderRadius: '8px',
      border: '1px solid #fbbf24',
      marginTop: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <AlertTriangle size={20} className="text-warning" />
        <h3 className="text-warning" style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
          Data Quality Warnings ({allWarnings.reduce((sum, w) => sum + w.warnings.length, 0)})
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
        {allWarnings.map((item) => (
          <div key={item.regime} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fcd34d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{item.regime}</div>
              <div className={item.score >= 70 ? 'bg-success/10 text-success' : item.score >= 40 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'} style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: '600'
              }}>
                {item.score}% Quality
              </div>
            </div>
            <ul className="text-muted-foreground" style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
              {item.warnings.slice(0, 3).map((warning, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{warning}</li>
              ))}
              {item.warnings.length > 3 && (
                <li className="text-muted-foreground" style={{ fontStyle: 'italic' }}>
                  +{item.warnings.length - 3} more warnings
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper component for Regime Qualification Tab
function RegimeQualificationTab({
  eligibilities,
  allRegimes,
  clientId
}: {
  eligibilities: RegimeEligibility[],
  allRegimes: string[],
  clientId: number
}) {
  const [expandedRegimes, setExpandedRegimes] = useState<Record<string, { matched: boolean; unmatched: boolean }>>({})
  const [rules, setRules] = useState<Record<string, any[]>>({})

  useEffect(() => {
    // Initialize expanded state: matched expanded, unmatched collapsed
    const initialExpanded: Record<string, { matched: boolean; unmatched: boolean }> = {}
    eligibilities.forEach(elig => {
      initialExpanded[elig.regime] = { matched: true, unmatched: false }
    })
    setExpandedRegimes(initialExpanded)
  }, [eligibilities])

  useEffect(() => {
    // Fetch all rules for displaying rule configs
    const fetchRules = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/classification-rules')
        const data = await res.json()

        // Group rules by regime
        const rulesByRegime: Record<string, any[]> = {}
        data.forEach((rule: any) => {
          if (!rulesByRegime[rule.regime]) {
            rulesByRegime[rule.regime] = []
          }
          rulesByRegime[rule.regime].push(rule)
        })
        setRules(rulesByRegime)
      } catch (err) {
        console.error('Failed to fetch classification rules', err)
      }
    }
    fetchRules()
  }, [])

  const toggleSection = (regime: string, section: 'matched' | 'unmatched') => {
    setExpandedRegimes(prev => ({
      ...prev,
      [regime]: {
        ...prev[regime],
        [section]: !prev[regime]?.[section]
      }
    }))
  }

  const getRuleConfig = (ruleId: number) => {
    for (const regimeRules of Object.values(rules)) {
      const rule = regimeRules.find(r => r.id === ruleId)
      if (rule) return rule
    }
    return null
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', border: '1px solid #e5e7eb' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          Regime Qualification Summary
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          Detailed breakdown of qualification rules for each regulatory regime
        </p>
      </div>

      {eligibilities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No regime qualifications yet</h3>
          <p style={{ fontSize: '14px' }}>Run regime eligibility evaluation to see qualification details</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {eligibilities.map(elig => {
            const isMatchedExpanded = expandedRegimes[elig.regime]?.matched ?? true
            const isUnmatchedExpanded = expandedRegimes[elig.regime]?.unmatched ?? false

            return (
              <div
                key={elig.id}
                style={{
                  border: '2px solid',
                  borderColor: elig.is_eligible ? '#d1fae5' : '#e5e7eb',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: elig.is_eligible ? '#f0fdf4' : '#f9fafb'
                }}
              >
                {/* Regime Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {elig.regime}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      {elig.eligibility_reason}
                    </p>
                  </div>
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: elig.is_eligible ? '#d1fae5' : '#f3f4f6',
                    color: elig.is_eligible ? '#065f46' : '#6b7280'
                  }}>
                    {elig.is_eligible ? '✓ Eligible' : '✗ Not Eligible'}
                  </span>
                </div>

                {/* Client Attributes Used for Evaluation */}
                {elig.client_attributes && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <span>🔍</span>
                      Evaluated Attributes (Snapshot)
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      {elig.client_attributes.account_type && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Account Type:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.account_type}
                          </span>
                        </div>
                      )}
                      {elig.client_attributes.booking_location && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Booking Location:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.booking_location}
                          </span>
                        </div>
                      )}
                      {elig.client_attributes.product_grid?.product_group && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Product Group:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.product_grid.product_group}
                          </span>
                        </div>
                      )}
                      {elig.client_attributes.product_grid?.product_type && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Product Type:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.product_grid.product_type}
                          </span>
                        </div>
                      )}
                      {elig.client_attributes.product_grid?.product_status && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Product Status:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.product_grid.product_status}
                          </span>
                        </div>
                      )}
                      {elig.client_attributes.product_grid?.bank_entity && (
                        <div>
                          <span className="font-semibold text-muted-foreground">Bank Entity:</span>{' '}
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {elig.client_attributes.product_grid.bank_entity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Matched Rules Section */}
                {elig.matched_rules && elig.matched_rules.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => toggleSection(elig.regime, 'matched')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#d1fae5',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                        ✅ Matched Rules ({elig.matched_rules.length})
                      </span>
                      <span style={{ fontSize: '18px', color: '#065f46' }}>
                        {isMatchedExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {isMatchedExpanded && (
                      <div style={{ marginTop: '12px', paddingLeft: '16px' }}>
                        {elig.matched_rules.map((rule, idx) => {
                          const ruleConfig = getRuleConfig(rule.rule_id)
                          return (
                            <div
                              key={idx}
                              style={{
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #86efac'
                              }}
                            >
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {rule.rule_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                Type: <span style={{ fontWeight: '600' }}>{rule.rule_type}</span>
                              </div>
                              {ruleConfig && ruleConfig.rule_config && (
                                <div style={{
                                  fontSize: '11px',
                                  padding: '8px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  color: '#374151'
                                }}>
                                  {JSON.stringify(ruleConfig.rule_config, null, 2)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Unmatched Rules Section */}
                {elig.unmatched_rules && elig.unmatched_rules.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleSection(elig.regime, 'unmatched')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
                        ❌ Unmatched Rules ({elig.unmatched_rules.length})
                      </span>
                      <span style={{ fontSize: '18px', color: '#991b1b' }}>
                        {isUnmatchedExpanded ? '▼' : '▶'}
                      </span>
                    </button>

                    {isUnmatchedExpanded && (
                      <div style={{ marginTop: '12px', paddingLeft: '16px' }}>
                        {elig.unmatched_rules.map((rule, idx) => {
                          const ruleConfig = getRuleConfig(rule.rule_id)
                          return (
                            <div
                              key={idx}
                              style={{
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #fca5a5'
                              }}
                            >
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {rule.rule_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                Type: <span style={{ fontWeight: '600' }}>{rule.rule_type}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                <div style={{
                                  fontSize: '11px',
                                  padding: '6px 8px',
                                  backgroundColor: '#fef3c7',
                                  borderRadius: '4px',
                                  border: '1px solid #fbbf24'
                                }}>
                                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '2px' }}>Expected:</div>
                                  <div style={{ fontFamily: 'monospace', color: '#78350f' }}>
                                    {JSON.stringify(rule.expected)}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  padding: '6px 8px',
                                  backgroundColor: '#fee2e2',
                                  borderRadius: '4px',
                                  border: '1px solid #fca5a5'
                                }}>
                                  <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '2px' }}>Actual:</div>
                                  <div style={{ fontFamily: 'monospace', color: '#7f1d1d' }}>
                                    {JSON.stringify(rule.actual)}
                                  </div>
                                </div>
                              </div>
                              {ruleConfig && ruleConfig.rule_config && (
                                <div style={{
                                  fontSize: '11px',
                                  padding: '8px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  color: '#374151'
                                }}>
                                  {JSON.stringify(ruleConfig.rule_config, null, 2)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Show message if no rules at all */}
                {(!elig.matched_rules || elig.matched_rules.length === 0) &&
                 (!elig.unmatched_rules || elig.unmatched_rules.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                    No rule evaluation data available for this regime
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note with link to detailed rules page */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Note:</strong> This view shows rule evaluation results for this specific client.
          To view and manage all classification rules across regimes, visit the{' '}
          <a
            href="/classification-rules"
            style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: '600' }}
          >
            Classification Rules Management
          </a>{' '}
          page.
        </p>
      </div>
    </div>
  )
}

// Simulate External Trigger Button Component
function SimulateExternalTriggerButton({
  stages,
  clientId,
  onTriggerComplete
}: {
  stages: OnboardingStage[],
  clientId: number,
  onTriggerComplete: () => void
}) {
  const [isTriggering, setIsTriggering] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; regime: string }>({ current: 0, total: 20, regime: '' })

  // Check if button should be shown
  const legalEntityStage = stages.find(s => s.stage_name === 'Legal Entity Setup')
  const regClassificationStage = stages.find(s => s.stage_name === 'Regulatory Classification')

  const shouldShowButton =
    legalEntityStage?.status === 'completed' &&
    regClassificationStage?.status === 'not_started'

  if (!shouldShowButton) {
    return null
  }

  const handleTrigger = async () => {
    setIsTriggering(true)
    setShowModal(true)
    setProgress({ current: 0, total: 20, regime: 'Initializing...' })

    try {
      // Fetch all regimes
      const regimesRes = await fetch('http://localhost:8000/api/regimes')
      const allRegimes = await regimesRes.json()

      // Evaluate all regimes one by one
      for (let i = 0; i < allRegimes.length; i++) {
        const regime = allRegimes[i]
        setProgress({ current: i + 1, total: allRegimes.length, regime })

        await fetch(`http://localhost:8000/api/clients/${clientId}/evaluate-eligibility?regime=${encodeURIComponent(regime)}`, {
          method: 'POST'
        })

        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // Update the Regulatory Classification stage to IN_PROGRESS
      const regStageRes = await fetch(`http://localhost:8000/api/clients/${clientId}/onboarding`)
      const allStages = await regStageRes.json()
      const regStage = allStages.find((s: OnboardingStage) => s.stage_name === 'Regulatory Classification')

      if (regStage) {
        await fetch(`http://localhost:8000/api/onboarding/${regStage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        })
      }

      setProgress({ current: allRegimes.length, total: allRegimes.length, regime: 'Complete!' })

      // Wait a moment before closing
      await new Promise(resolve => setTimeout(resolve, 1000))

      setShowModal(false)
      onTriggerComplete()
    } catch (err) {
      console.error('Failed to trigger regime evaluation', err)
      setProgress({ current: 0, total: 20, regime: 'Error occurred' })
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <>
      <button
        onClick={handleTrigger}
        disabled={isTriggering}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: isTriggering ? '#9ca3af' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isTriggering ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          if (!isTriggering) {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
          }
        }}
        onMouseLeave={(e) => {
          if (!isTriggering) {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }
        }}
      >
        <RefreshCw size={16} style={{ animation: isTriggering ? 'spin 1s linear infinite' : 'none' }} />
        Simulate External Trigger
      </button>

      {/* Progress Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px', textAlign: 'center' }}>
              Evaluating Regime Eligibility
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Progress</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                  {progress.current} / {progress.total}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease',
                  borderRadius: '6px'
                }} />
              </div>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                Currently evaluating
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {progress.regime}
              </div>
            </div>

            {progress.current === progress.total && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#065f46'
              }}>
                ✓ All regimes evaluated successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
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

  // Client Central sync state
  const [cxSyncStatus, setCxSyncStatus] = useState<any>(null)
  const [publishingToCX, setPublishingToCX] = useState(false)

  // Document requirements state (for validation summary)
  const [documentRequirements, setDocumentRequirements] = useState<any>(null)
  const [loadingDocRequirements, setLoadingDocRequirements] = useState(false)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)

        // Fetch regimes
        const regimesRes = await fetch('http://localhost:8000/api/regimes')
        const regimesData = await regimesRes.json()
        setRegimes(regimesData)

        // Fetch client data
        const [clientData, stagesData, classificationsData, riskScoreData] = await Promise.all([
          clientsApi.getById(Number(clientId)),
          onboardingApi.getStages(Number(clientId)),
          regulatoryApi.getClassifications(Number(clientId)),
          clientsApi.getRiskScore(Number(clientId))
        ])
        setClient(clientData)
        setStages(stagesData)
        setClassifications(classificationsData)
        setRiskScore(riskScoreData)

        // Fetch eligibilities
        const eligRes = await fetch(`http://localhost:8000/api/clients/${clientId}/regime-eligibility`)
        const eligData = await eligRes.json()
        setEligibilities(eligData)

        // Fetch data quality for each regime
        const qualityMap: Record<string, DataQualityResult> = {}
        for (const elig of eligData) {
          try {
            const qualityRes = await fetch(`http://localhost:8000/api/clients/${clientId}/data-quality?regime=${elig.regime}`)
            const qualityData = await qualityRes.json()
            qualityMap[`${clientId}_${elig.regime}`] = qualityData
          } catch (err) {
            console.error(`Failed to fetch data quality for regime ${elig.regime}`, err)
          }
        }
        setDataQuality(qualityMap)

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (clientId) {
      fetchClientData()
    }
  }, [clientId])

  const handleEvaluateRegime = async (regime: string) => {
    try {
      setEvaluating(regime)
      await fetch(`http://localhost:8000/api/clients/${clientId}/evaluate-eligibility?regime=${regime}`, {
        method: 'POST'
      })
      // Refresh eligibility data
      const eligRes = await fetch(`http://localhost:8000/api/clients/${clientId}/regime-eligibility`)
      const eligData = await eligRes.json()
      setEligibilities(eligData)
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
        { method: 'POST' }
      )
      const result = await response.json()

      // Show success notification
      alert(`Client Central Product Approval Simulated!\n\n` +
            `Product Approved: ${result.product_approved}\n` +
            `Regimes Evaluated: ${result.regimes_evaluated}\n` +
            `Eligible Regimes: ${result.eligible_regimes.length}`)

      // Refresh all client data
      if (clientId) {
        const [clientData, stagesData, eligData] = await Promise.all([
          clientsApi.getById(Number(clientId)),
          onboardingApi.getStages(Number(clientId)),
          fetch(`http://localhost:8000/api/clients/${clientId}/regime-eligibility`).then(r => r.json())
        ])
        setClient(clientData)
        setStages(stagesData)
        setEligibilities(eligData)
      }
    } catch (error) {
      console.error('Failed to simulate Client Central approval:', error)
      alert('Failed to simulate Client Central product approval')
    } finally {
      setLoading(false)
    }
  }

  const fetchCXSyncStatus = async () => {
    if (!clientId) return
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/cx-sync-status`)
      const data = await response.json()
      setCxSyncStatus(data)
    } catch (error) {
      console.error('Failed to fetch Client Central sync status:', error)
    }
  }

  const handlePublishToCX = async () => {
    if (!clientId) return
    setPublishingToCX(true)
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/publish-classification-to-cx`, {
        method: 'POST'
      })
      const result = await response.json()

      alert(`Classification Published to Client Central Successfully!\n\n` +
            `Client Central Reference ID: ${result.cx_reference_id}\n` +
            `Regimes Published: ${result.regimes_published}\n` +
            `Data Quality Warnings: ${result.data_quality_warnings.length}`)

      // Refresh Client Central sync status
      await fetchCXSyncStatus()
    } catch (error) {
      console.error('Failed to publish to Client Central:', error)
      alert('Failed to publish classification to Client Central')
    } finally {
      setPublishingToCX(false)
    }
  }

  const fetchDocumentRequirements = async () => {
    if (!clientId) return
    setLoadingDocRequirements(true)
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/document-requirements`)
      const data = await response.json()
      setDocumentRequirements(data)
    } catch (error) {
      console.error('Failed to fetch document requirements:', error)
    } finally {
      setLoadingDocRequirements(false)
    }
  }

  // Fetch Client Central sync status when regulatory tab is opened
  useEffect(() => {
    if (activeTab === 'regulatory' && clientId) {
      fetchCXSyncStatus()
      fetchDocumentRequirements()
    }
  }, [activeTab, clientId])

  // Fetch document requirements when documents tab is opened
  useEffect(() => {
    if (activeTab === 'documents' && clientId) {
      fetchDocumentRequirements()
    }
  }, [activeTab, clientId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', text: '#065f46' }
      case 'blocked': return { bg: '#fee2e2', text: '#991b1b' }
      case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' }
      default: return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'in_progress': return '#3b82f6'
      case 'blocked': return '#ef4444'
      default: return '#d1d5db'
    }
  }

  const getEligibilityBadge = (isEligible: boolean) => {
    if (isEligible) {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} />
          Eligible
        </div>
      )
    } else {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <XCircle size={16} />
          Not Eligible
        </div>
      )
    }
  }

  const getQualityScoreBadge = (score: number) => {
    let bgColor = '#fee2e2'
    let textColor = '#991b1b'
    let icon = <AlertCircle size={16} />

    if (score >= 80) {
      bgColor = '#d1fae5'
      textColor = '#065f46'
      icon = <CheckCircle2 size={16} />
    } else if (score >= 50) {
      bgColor = '#fef3c7'
      textColor = '#92400e'
      icon = <AlertTriangle size={16} />
    }

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '600'
      }}>
        {icon}
        {score.toFixed(0)}% Complete
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading client details...</h2>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h2>Error: {error || 'Client not found'}</h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const statusColors = getStatusColor(client.onboarding_status)

  // Calculate tab badges
  const getTabBadge = (tabId: TabType): string | null => {
    switch (tabId) {
      case 'regulatory': {
        const totalItems = eligibilities.length + classifications.length
        if (totalItems === 0) return null
        const eligibleCount = eligibilities.filter(e => e.is_eligible).length
        const legacyCount = classifications.length
        return `${eligibleCount + legacyCount}`
      }
      case 'documents': {
        // Calculate missing mandatory documents from data quality
        let missingCount = 0
        Object.values(dataQuality).forEach(quality => {
          if (quality.missing_evidences) {
            missingCount += quality.missing_evidences.length
          }
        })
        return missingCount > 0 ? `${missingCount} missing` : null
      }
      case 'tasks': {
        // Would need task data - placeholder for now
        return null
      }
      default:
        return null
    }
  }

  const tabs: { id: TabType; label: string; icon: JSX.Element; badge?: string | null }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'regulatory', label: 'Regulatory Due Diligence', icon: <FileCheck size={20} /> },
    { id: 'documents', label: 'Document Requirements', icon: <FileText size={20} /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo size={20} /> }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '24px 40px' }}>
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              color: '#6b7280',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.color = '#3b82f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.color = '#6b7280'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {client.name}
          </h1>
          <span style={{
            padding: '6px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}>
            {client.onboarding_status.replace('_', ' ').toUpperCase()}
          </span>
          {riskScore && <RiskBadge riskScore={riskScore} size="medium" />}
        </div>
        {riskScore && riskScore.risk_factors.length > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: `${riskScore.risk_color}10`,
            border: `1px solid ${riskScore.risk_color}30`,
            borderRadius: '8px',
            fontSize: '13px',
            color: '#374151'
          }}>
            <strong style={{ color: riskScore.risk_color }}>Risk Factors:</strong> {riskScore.risk_factors.join(', ')}
          </div>
        )}
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#374151' }}>Entity ID:</strong> {client.legal_entity_id}</span>
          <span><strong style={{ color: '#374151' }}>Country of Incorporation:</strong> {client.country_of_incorporation}</span>
          <span><strong style={{ color: '#374151' }}>Entity Type:</strong> {client.entity_type}</span>
          <span><strong style={{ color: '#374151' }}>RM:</strong> {client.assigned_rm}</span>
        </div>

        {/* Key Classification Attributes - Prominent Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Product
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {client.client_attributes?.product || 'Not specified'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Booking Location
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {client.client_attributes?.booking_location || 'Not specified'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Country of Incorporation
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {client.country_of_incorporation || 'Not specified'}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div style={{ backgroundColor: 'white', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map((tab) => {
              const badge = getTabBadge(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 24px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    top: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = '#6b7280'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {badge && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: activeTab === tab.id ? '#dbeafe' : '#f3f4f6',
                      color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                      marginLeft: '4px'
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 40px' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Onboarding Progress Section */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                  Onboarding Progress
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {client?.cumulative_tat_days && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        Cumulative TAT
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                        {client.cumulative_tat_days} days
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        ({client.cumulative_tat_hours?.toFixed(1)} hours)
                      </div>
                    </div>
                  )}
                  <SimulateExternalTriggerButton
                    stages={stages}
                    clientId={Number(clientId)}
                    onTriggerComplete={() => {
                      // Refresh client data
                      if (clientId) {
                        Promise.all([
                          onboardingApi.getStages(Number(clientId)),
                          fetch(`http://localhost:8000/api/clients/${clientId}/regime-eligibility`).then(r => r.json())
                        ]).then(([stagesData, eligData]) => {
                          setStages(stagesData)
                          setEligibilities(eligData)
                        })
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                {/* Progress Line */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  right: '20px',
                  height: '3px',
                  backgroundColor: '#e5e7eb',
                  zIndex: 0,
                }} />

                {/* Stages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', position: 'relative', zIndex: 1 }}>
                  {STAGES.map((stageName) => {
                    const stage = stages.find(s => s.stage_name === stageName)
                    const status = stage?.status || 'not_started'
                    const color = getStageStatusColor(status)
                    const isActive = status === 'in_progress'
                    const isOverdue = stage?.is_overdue || false

                    return (
                      <div key={stageName} style={{ textAlign: 'center' }}>
                        {/* Stage Circle */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          margin: '0 auto 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isActive ? '4px solid #dbeafe' : isOverdue ? '3px solid #fca5a5' : 'none',
                          boxShadow: isActive ? '0 0 0 6px rgba(59, 130, 246, 0.1)' : isOverdue ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none',
                        }}>
                          {status === 'completed' && (
                            <span style={{ color: 'white', fontSize: '18px' }}>✓</span>
                          )}
                          {status === 'in_progress' && (
                            <span style={{ color: 'white', fontSize: '20px' }}>⟳</span>
                          )}
                          {status === 'blocked' && (
                            <span style={{ color: 'white', fontSize: '18px' }}>!</span>
                          )}
                        </div>

                        {/* Stage Name */}
                        <div style={{
                          fontSize: '12px',
                          color: status === 'not_started' ? '#9ca3af' : '#374151',
                          fontWeight: isActive ? '600' : '500',
                          lineHeight: '1.4',
                          marginBottom: '8px'
                        }}>
                          {stageName}
                        </div>

                        {/* TAT Display */}
                        {stage && stage.tat_days !== null && stage.tat_days !== undefined && (
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: isOverdue ? '#dc2626' : '#059669',
                            marginBottom: '4px',
                            backgroundColor: isOverdue ? '#fee2e2' : '#d1fae5',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'inline-block',
                          }}>
                            {stage.tat_days} days
                          </div>
                        )}

                        {/* Target TAT */}
                        {stage && stage.target_tat_hours && (
                          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px' }}>
                            Target: {(stage.target_tat_hours / 24).toFixed(1)}d
                          </div>
                        )}

                        {/* Stage Details */}
                        {stage && (
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                            {stage.assigned_team && <div style={{ fontWeight: '500' }}>{stage.assigned_team}</div>}
                            {stage.notes && (
                              <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#ef4444', fontSize: '10px' }}>
                                {stage.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Client Central Product Approval Button - Show if Legal Entity Setup is in progress */}
              {client && client.onboarding_status === 'in_progress' &&
               stages.some(s => s.stage_name === 'Legal Entity Setup' && s.status === 'in_progress') && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                    Client Central Product Approval Required
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '12px' }}>
                    Simulate product approval from Client Central to trigger regulatory classification across {regimes.length}+ regimes
                  </div>
                  <button
                    onClick={handleSimulateCXApproval}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = '#2563eb'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = '#3b82f6'
                    }}
                  >
                    {loading ? 'Processing...' : '▶ Simulate Client Central Product Approval'}
                  </button>
                </div>
              )}
            </div>

            {/* Regulatory Overview Section - Two Lanes */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                {/* Lane 1: Regulatory Classifications */}
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>⚖️</span>
                    Regulatory Classifications
                  </h2>

                  {classifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                      <div style={{ fontSize: '14px' }}>No classifications yet</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {classifications.map((classification) => (
                        <RegulatoryClassificationCard
                          key={classification.id}
                          classification={classification}
                        />
                      ))}
                    </div>
                  )}

                  {/* Show assessed regimes info */}
                  {eligibilities.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎯</span>
                        Regime Assessment Summary
                      </div>
                      <div style={{ fontSize: '11px', color: '#1e40af', lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '4px' }}>
                          • <strong>Evaluated:</strong> {eligibilities.length} of {regimes.length} regulatory regimes
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          • <strong>Eligible:</strong> {eligibilities.filter(e => e.is_eligible).length} regime{eligibilities.filter(e => e.is_eligible).length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          • <strong>Legacy Classifications:</strong> {classifications.length} framework{classifications.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic', borderTop: '1px solid #bfdbfe', paddingTop: '8px' }}>
                        All {regimes.length} regimes are assessed. Only applicable regimes result in classifications.
                      </div>
                    </div>
                  )}
                </div>

                {/* Lane 2: Documentation Requirements */}
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📋</span>
                    Documentation Requirements
                  </h2>

                  <DocumentRequirementsLane clientId={clientId} />
                </div>
              </div>

              {/* Data Quality Warnings Summary (Overview Only) */}
              {(() => {
                // Calculate total warnings across all regimes
                let totalWarnings = 0
                let criticalWarnings = 0
                let regimesWithWarnings = 0

                eligibilities.forEach((elig) => {
                  const quality = dataQuality[`${clientId}_${elig.regime}`]
                  if (quality && quality.warnings && quality.warnings.length > 0) {
                    totalWarnings += quality.warnings.length
                    regimesWithWarnings++
                    // Count critical warnings (e.g., missing/expired documents)
                    const critical = quality.warnings.filter((w: string) =>
                      w.toLowerCase().includes('missing') || w.toLowerCase().includes('expired')
                    ).length
                    criticalWarnings += critical
                  }
                })

                if (totalWarnings === 0) return null

                return (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 18px',
                    backgroundColor: criticalWarnings > 0 ? '#fef2f2' : '#fffbeb',
                    borderRadius: '8px',
                    border: `1px solid ${criticalWarnings > 0 ? '#fca5a5' : '#fbbf24'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertTriangle size={20} color={criticalWarnings > 0 ? '#dc2626' : '#f59e0b'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: criticalWarnings > 0 ? '#991b1b' : '#92400e' }}>
                          {criticalWarnings > 0 ? `${criticalWarnings} Critical Warning${criticalWarnings !== 1 ? 's' : ''}` : 'Data Quality Alerts'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {totalWarnings} total warning{totalWarnings !== 1 ? 's' : ''} across {regimesWithWarnings} regime{regimesWithWarnings !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('regulatory')}
                      style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: 'white',
                        color: criticalWarnings > 0 ? '#dc2626' : '#f59e0b',
                        border: `1px solid ${criticalWarnings > 0 ? '#fca5a5' : '#fbbf24'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = criticalWarnings > 0 ? '#fee2e2' : '#fef3c7'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                )
              })()}

              {/* Client Attributes Section */}
              {client?.client_attributes && (
                <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '2px solid #0ea5e9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '24px' }}>🏢</span>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Client Attributes
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      backgroundColor: '#bae6fd',
                      color: '#075985',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Used for Rule Evaluation
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {/* Left Column: Basic Attributes */}
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📊</span>
                        Basic Attributes
                      </h4>

                      {client.client_attributes.account_type && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Account Type
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', padding: '6px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', border: '1px solid #7dd3fc' }}>
                            {client.client_attributes.account_type}
                          </div>
                        </div>
                      )}

                      {client.client_attributes.booking_location && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            Booking Location
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', padding: '6px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', border: '1px solid #7dd3fc' }}>
                            {client.client_attributes.booking_location}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Product Grid */}
                    {client.client_attributes.product_grid && (
                      <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🎯</span>
                          Product Grid
                        </h4>

                        {client.client_attributes.product_grid.product_group && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Group:</span>{' '}
                            <span style={{ fontSize: '12px', color: '#111827' }}>{client.client_attributes.product_grid.product_group}</span>
                          </div>
                        )}

                        {client.client_attributes.product_grid.product_category && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Category:</span>{' '}
                            <span style={{ fontSize: '12px', color: '#111827' }}>{client.client_attributes.product_grid.product_category}</span>
                          </div>
                        )}

                        {client.client_attributes.product_grid.product_type && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Type:</span>{' '}
                            <span style={{ fontSize: '12px', color: '#111827' }}>{client.client_attributes.product_grid.product_type}</span>
                          </div>
                        )}

                        {client.client_attributes.product_grid.product_status && (
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Status:</span>{' '}
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: client.client_attributes.product_grid.product_status === 'approved' ? '#d1fae5' : '#fee2e2',
                              color: client.client_attributes.product_grid.product_status === 'approved' ? '#065f46' : '#991b1b'
                            }}>
                              {client.client_attributes.product_grid.product_status}
                            </span>
                          </div>
                        )}

                        {client.client_attributes.product_grid.bank_entity && (
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Bank Entity:</span>{' '}
                            <span style={{ fontSize: '12px', color: '#111827' }}>{client.client_attributes.product_grid.bank_entity}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #7dd3fc' }}>
                    <p style={{ fontSize: '11px', color: '#0c4a6e', margin: 0, fontStyle: 'italic' }}>
                      💡 <strong>Note:</strong> These attributes are evaluated against classification rules to determine regime eligibility.
                      View detailed rule evaluation in the "Regime Qualification" tab.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regulatory Due Diligence Tab */}
        {activeTab === 'regulatory' && (
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', border: '1px solid #e5e7eb' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                  Regulatory Due Diligence
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Evaluate regime eligibility and monitor mandatory evidence completeness
                </p>
              </div>

              {/* External Rule Engine Integration Banner */}
              <div style={{
                marginBottom: '28px',
                padding: '16px 20px',
                backgroundColor: '#f0f9ff',
                borderRadius: '10px',
                border: '2px solid #0ea5e9',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#0ea5e9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🔗
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#075985', marginBottom: '4px' }}>
                    External Rule Engine Integration
                  </div>
                  <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.5' }}>
                    Classification rules are executed in <strong>Droit Platform</strong> and results are synchronized to this system.
                    Changes in client attributes or rules trigger automatic re-evaluation.
                  </div>
                </div>
              </div>

              {/* Classification History (Legacy Classifications) - Collapsed Accordion */}
              {classifications.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <button
                    onClick={() => setIsLegacyExpanded(!isLegacyExpanded)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      backgroundColor: '#f9fafb',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                      e.currentTarget.style.borderColor = '#d1d5db'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '20px' }}>📚</span>
                      <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0, marginBottom: '4px' }}>
                          Classification History
                        </h3>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                          {classifications.length} historical manual classification{classifications.length !== 1 ? 's' : ''} (pre-automation)
                        </p>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginLeft: '8px'
                      }}>
                        Audit Only
                      </span>
                    </div>
                    <span style={{ fontSize: '18px', color: '#6b7280', transition: 'transform 0.2s', transform: isLegacyExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>

                  {isLegacyExpanded && (
                    <div style={{ marginTop: '16px', padding: '20px', backgroundColor: '#fafafa', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#fffbeb',
                        borderRadius: '8px',
                        border: '1px solid #fde047',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#78350f',
                        lineHeight: '1.6'
                      }}>
                        <strong>⚠️ Note:</strong> These are historical classifications assigned before the automated rule engine implementation.
                        They are maintained for audit purposes only. <strong>Current authoritative assessments are shown in the Rule-Based Assessment section below.</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {classifications.map(classification => (
                          <div
                            key={classification.id}
                            style={{
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              padding: '16px',
                              backgroundColor: 'white'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                                  {classification.framework}
                                </div>
                                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                                  <span style={{ fontWeight: '600' }}>Classification:</span> {classification.classification}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                  <span style={{ fontWeight: '600' }}>Classified:</span> {new Date(classification.classification_date).toLocaleDateString()}
                                </div>
                                {classification.validation_notes && (
                                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', fontStyle: 'italic' }}>
                                    "{classification.validation_notes}"
                                  </div>
                                )}
                              </div>
                              <div style={{
                                padding: '4px 10px',
                                backgroundColor: classification.validation_status === 'validated' ? '#d1fae5' :
                                               classification.validation_status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                color: classification.validation_status === 'validated' ? '#065f46' :
                                       classification.validation_status === 'rejected' ? '#991b1b' : '#92400e',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                              }}>
                                {classification.validation_status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rule-Based Assessment Section */}
              {eligibilities.length === 0 && classifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No regime evaluations yet</h3>
                  <p style={{ fontSize: '14px' }}>Regime eligibility evaluations will appear here once processed</p>
                </div>
              ) : eligibilities.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#059669', margin: 0 }}>
                      Rule-Based Assessment
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 10px',
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Current
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Automated evaluation based on configured classification rules and client attributes.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {eligibilities.map(elig => {
                    const quality = dataQuality[`${clientId}_${elig.regime}`]

                    return (
                      <div
                        key={elig.id}
                        style={{
                          border: '2px solid',
                          borderColor: elig.is_eligible ? '#d1fae5' : '#fee2e2',
                          borderRadius: '12px',
                          padding: '24px',
                          backgroundColor: elig.is_eligible ? '#f0fdf4' : '#fef2f2',
                          minWidth: 0,
                          overflowX: 'auto'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                              {elig.regime} Regime
                            </div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                              {getEligibilityBadge(elig.is_eligible)}
                              {quality && getQualityScoreBadge(quality.quality_score)}
                            </div>

                            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '12px', lineHeight: '1.6' }}>
                              {elig.eligibility_reason}
                            </div>

                            {/* Evaluated Attributes Section */}
                            {elig.client_attributes && (
                              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>🔍</span>
                                  Evaluated Attributes
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                  {elig.client_attributes.account_type && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Account Type</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.account_type}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.booking_location && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Booking Location</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.booking_location}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.product_grid?.product_group && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product Group</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.product_grid.product_group}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.product_grid?.product_category && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product Category</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.product_grid.product_category}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.product_grid?.product_type && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product Type</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.product_grid.product_type}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.product_grid?.product_status && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product Status</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.product_grid.product_status}</div>
                                      </div>
                                    </div>
                                  )}
                                  {elig.client_attributes.product_grid?.bank_entity && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                                      <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '700' }}>✓</span>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Bank Entity</div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{elig.client_attributes.product_grid.bank_entity}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Matched and Unmatched Rules */}
                            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: elig.unmatched_rules && elig.unmatched_rules.length > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', gap: '20px' }}>
                              <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '10px', border: '2px solid #86efac', minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '16px' }}>✅</span>
                                  Matched Rules ({elig.matched_rules?.length || 0})
                                </div>
                                {elig.matched_rules && elig.matched_rules.length > 0 ? (
                                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: '2' }}>
                                    {elig.matched_rules.map((rule, idx) => (
                                      <li key={idx} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                        <strong>{rule.rule_name}</strong>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Type: {rule.rule_type}</div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>No rules matched</div>
                                )}
                              </div>

                              {elig.unmatched_rules && elig.unmatched_rules.length > 0 && (
                                <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '10px', border: '2px solid #fca5a5', minWidth: 0 }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>❌</span>
                                    Unmatched Rules ({elig.unmatched_rules.length})
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {elig.unmatched_rules.map((rule, idx) => (
                                      <div key={idx} style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', marginBottom: '6px', wordBreak: 'break-word' }}>{rule.rule_name}</div>
                                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>Type: {rule.rule_type}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
                                          <div style={{ padding: '4px 6px', backgroundColor: '#fef3c7', borderRadius: '4px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            <strong style={{ color: '#92400e' }}>Expected:</strong> {JSON.stringify(rule.expected, null, 2)}
                                          </div>
                                          <div style={{ padding: '4px 6px', backgroundColor: '#fee2e2', borderRadius: '4px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            <strong style={{ color: '#991b1b' }}>Actual:</strong> {JSON.stringify(rule.actual, null, 2)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Data Quality Warnings */}
                            {quality && quality.warnings.length > 0 && (
                              <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '8px',
                                border: '1px solid #fbbf24'
                              }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <AlertTriangle size={16} />
                                  Data Quality Warnings
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#78350f', lineHeight: '1.8' }}>
                                  {quality.warnings.slice(0, 3).map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                  {quality.warnings.length > 3 && (
                                    <li style={{ fontWeight: '600' }}>...and {quality.warnings.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleEvaluateRegime(elig.regime)}
                            disabled={evaluating === elig.regime}
                            style={{
                              padding: '10px 16px',
                              fontSize: '13px',
                              backgroundColor: evaluating === elig.regime ? '#9ca3af' : '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: evaluating === elig.regime ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              height: 'fit-content'
                            }}
                            onMouseEnter={(e) => {
                              if (evaluating !== elig.regime) {
                                e.currentTarget.style.backgroundColor = '#374151'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (evaluating !== elig.regime) {
                                e.currentTarget.style.backgroundColor = '#6b7280'
                              }
                            }}
                          >
                            <RefreshCw size={16} style={{ animation: evaluating === elig.regime ? 'spin 1s linear infinite' : 'none' }} />
                            Re-evaluate
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                </div>
              ) : null}

              {/* Client Central Publication Section */}
              <div style={{ marginTop: '32px', backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '2px solid #e5e7eb' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={20} className="text-blue-600" />
                    Client Central Integration
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Publish classification results to Client Central system for downstream processing
                  </p>
                </div>

                {cxSyncStatus && (
                  <div style={{ marginBottom: '20px' }}>
                    {cxSyncStatus.cx_sync_status === 'synced' ? (
                      <div style={{ padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <CheckCircle2 size={20} className="text-green-600" />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                              Classification Published to Client Central
                            </div>
                            <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                              Last synced: {new Date(cxSyncStatus.cx_sync_date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#065f46', marginLeft: '32px' }}>
                          <div>Client Central Reference ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{cxSyncStatus.cx_reference_id}</span></div>
                          <div style={{ marginTop: '4px' }}>Regimes Classified: {cxSyncStatus.regimes_classified}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <AlertTriangle size={20} className="text-yellow-600" />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                              Classification Not Yet Published
                            </div>
                            <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                              Classification results are available but have not been sent to Client Central system
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {eligibilities.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    {documentRequirements?.summary && documentRequirements.summary.compliance_percentage < 90 && (
                      <div style={{ padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24', marginBottom: '16px', fontSize: '13px', color: '#92400e' }}>
                        <strong>Note:</strong> Classification will be published with document compliance exceptions flagged for review (Compliance: {documentRequirements.summary.compliance_percentage.toFixed(0)}%)
                      </div>
                    )}

                    <button
                      onClick={handlePublishToCX}
                      disabled={publishingToCX || eligibilities.length === 0}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: publishingToCX ? '#9ca3af' : '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: publishingToCX || eligibilities.length === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!publishingToCX && eligibilities.length > 0) {
                          e.currentTarget.style.backgroundColor = '#1d4ed8'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!publishingToCX) {
                          e.currentTarget.style.backgroundColor = '#2563eb'
                        }
                      }}
                    >
                      {publishingToCX ? (
                        <>
                          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          Publishing to Client Central...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          {cxSyncStatus?.cx_sync_status === 'synced' ? 'Re-publish to Client Central' : 'Publish Classification to Client Central'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Document Validation Summary */}
            {documentRequirements?.summary && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '2px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Document Validation Summary
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Overall Status</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: documentRequirements.summary.compliance_percentage >= 80 ? '#10b981' :
                             documentRequirements.summary.compliance_percentage >= 50 ? '#f59e0b' : '#ef4444',
                      textTransform: 'capitalize'
                    }}>
                      {documentRequirements.summary.compliance_percentage >= 80 ? 'Excellent' :
                       documentRequirements.summary.compliance_percentage >= 50 ? 'Good' : 'Needs Attention'}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Total Requirements</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                      {documentRequirements.summary.total_requirements}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Compliant</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                      {documentRequirements.summary.compliant_count}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Missing</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                      {documentRequirements.summary.missing_count}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Expired</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                      {documentRequirements.summary.expired_count}
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Compliance</div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: documentRequirements.summary.compliance_percentage >= 80 ? '#10b981' :
                             documentRequirements.summary.compliance_percentage >= 50 ? '#f59e0b' : '#ef4444'
                    }}>
                      {documentRequirements.summary.compliance_percentage.toFixed(0)}%
                    </div>
                  </div>

                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Can Publish to CX</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      <CheckCircle2 size={20} />
                      Yes
                    </div>
                  </div>
                </div>

                {/* Issues Found */}
                {(documentRequirements.summary.missing_count > 0 || documentRequirements.summary.expired_count > 0) && (
                  <div style={{ padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>Issues Found:</div>
                    {documentRequirements.summary.missing_count > 0 && (
                      <div style={{ fontSize: '12px', color: '#92400e', marginLeft: '12px' }}>
                        • {documentRequirements.summary.missing_count} missing document{documentRequirements.summary.missing_count > 1 ? 's' : ''} require{documentRequirements.summary.missing_count === 1 ? 's' : ''} attention
                      </div>
                    )}
                    {documentRequirements.summary.expired_count > 0 && (
                      <div style={{ fontSize: '12px', color: '#92400e', marginLeft: '12px' }}>
                        • {documentRequirements.summary.expired_count} expired document{documentRequirements.summary.expired_count > 1 ? 's need' : ' needs'} renewal
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Document Requirements Tab */}
            <DocumentRequirementsTab clientId={Number(clientId)} clientName={client.name} />
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '60px 28px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>Tasks & Activities</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Task tracking and activity log will be available here
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
