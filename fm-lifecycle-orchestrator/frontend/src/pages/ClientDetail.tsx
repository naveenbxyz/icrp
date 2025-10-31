import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { clientsApi, onboardingApi, regulatoryApi } from '../lib/api.ts'
import type { Client, OnboardingStage, RegulatoryClassification, RegimeEligibility, DataQualityResult } from '../types/index.ts'
import { RegulatoryFramework } from '../types/index.ts'
import RegulatoryClassificationCard from '../components/RegulatoryClassificationCard.tsx'
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, RefreshCw, FileCheck, LayoutDashboard, Shield, FileText, ListTodo, ArrowLeft } from 'lucide-react'
import DocumentRequirementsTab from '../components/DocumentRequirementsTab.tsx'

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup'
]

type TabType = 'overview' | 'regulatory' | 'classification' | 'documents' | 'tasks'

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
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)

        // Fetch regimes
        const regimesRes = await fetch('http://localhost:8000/api/regimes')
        const regimesData = await regimesRes.json()
        setRegimes(regimesData)

        // Fetch client data
        const [clientData, stagesData, classificationsData] = await Promise.all([
          clientsApi.getById(Number(clientId)),
          onboardingApi.getStages(Number(clientId)),
          regulatoryApi.getClassifications(Number(clientId))
        ])
        setClient(clientData)
        setStages(stagesData)
        setClassifications(classificationsData)

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

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'regulatory', label: 'Regulatory Due Diligence', icon: <FileCheck size={18} /> },
    { id: 'classification', label: 'Classification Rules', icon: <Shield size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo size={18} /> }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '14px', color: '#6b7280', flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#374151' }}>Entity ID:</strong> {client.legal_entity_id}</span>
          <span><strong style={{ color: '#374151' }}>Jurisdiction:</strong> {client.jurisdiction}</span>
          <span><strong style={{ color: '#374151' }}>Entity Type:</strong> {client.entity_type}</span>
          <span><strong style={{ color: '#374151' }}>RM:</strong> {client.assigned_rm}</span>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div style={{ backgroundColor: 'white', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map((tab) => (
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
              </button>
            ))}
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
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
                Onboarding Progress
              </h2>

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
                          border: isActive ? '4px solid #dbeafe' : 'none',
                          boxShadow: isActive ? '0 0 0 6px rgba(59, 130, 246, 0.1)' : 'none',
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
            </div>

            {/* Regulatory Classifications Section */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
                Regulatory Classifications
              </h2>

              {classifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No regulatory classifications found
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                  {classifications.map((classification) => (
                    <RegulatoryClassificationCard
                      key={classification.id}
                      classification={classification}
                    />
                  ))}
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

              {eligibilities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No regime evaluations yet</h3>
                  <p style={{ fontSize: '14px' }}>Regime eligibility evaluations will appear here once processed</p>
                </div>
              ) : (
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
                          backgroundColor: elig.is_eligible ? '#f0fdf4' : '#fef2f2'
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

                            {/* Matched and Unmatched Rules */}
                            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
                                  ✅ Matched Rules ({elig.matched_rules?.length || 0})
                                </div>
                                {elig.matched_rules && elig.matched_rules.length > 0 && (
                                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                                    {elig.matched_rules.map((rule, idx) => (
                                      <li key={idx}>{rule.rule_name}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
                                  ❌ Unmatched Rules ({elig.unmatched_rules?.length || 0})
                                </div>
                                {elig.unmatched_rules && elig.unmatched_rules.length > 0 && (
                                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                                    {elig.unmatched_rules.map((rule, idx) => (
                                      <li key={idx}>{rule.rule_name}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
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
                              transition: 'all 0.2s'
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
              )}
            </div>
          </div>
        )}

        {/* Classification Rules Tab */}
        {activeTab === 'classification' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
              Regime Qualification Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.values(RegulatoryFramework).map((framework) => {
                const classification = classifications.find(c => c.framework === framework)
                return (
                  <div
                    key={framework}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '20px 24px',
                      backgroundColor: classification ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '10px',
                      border: `2px solid ${classification ? '#86efac' : '#e5e7eb'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                        {framework}
                      </div>
                      {classification && (
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          {classification.classification}
                        </div>
                      )}
                    </div>
                    <div>
                      {classification ? (
                        <span style={{
                          padding: '6px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#d1fae5',
                          color: '#065f46'
                        }}>
                          ✓ Qualified
                        </span>
                      ) : (
                        <span style={{
                          padding: '6px 16px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          Not Classified
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentRequirementsTab clientId={Number(clientId)} clientName={client.name} />
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
