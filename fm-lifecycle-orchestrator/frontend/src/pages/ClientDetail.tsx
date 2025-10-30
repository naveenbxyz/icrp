import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { clientsApi, onboardingApi, regulatoryApi } from '../lib/api.ts'
import type { Client, OnboardingStage, RegulatoryClassification, ValidationStatus } from '../types/index.ts'
import { RegulatoryFramework } from '../types/index.ts'
import RegulatoryClassificationCard from '../components/RegulatoryClassificationCard.tsx'

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup'
]

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [stages, setStages] = useState<OnboardingStage[]>([])
  const [classifications, setClassifications] = useState<RegulatoryClassification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)
        const [clientData, stagesData, classificationsData] = await Promise.all([
          clientsApi.getById(Number(clientId)),
          onboardingApi.getStages(Number(clientId)),
          regulatoryApi.getClassifications(Number(clientId))
        ])
        setClient(clientData)
        setStages(stagesData)
        setClassifications(classificationsData)
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

  const getValidationStatusColor = (status: ValidationStatus) => {
    switch (status) {
      case ValidationStatus.VALIDATED: return { bg: '#d1fae5', text: '#065f46', label: 'Validated' }
      case ValidationStatus.REJECTED: return { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' }
      default: return { bg: '#fef3c7', text: '#92400e', label: 'Pending' }
    }
  }

  const isReviewOverdue = (nextReviewDate: string | null) => {
    if (!nextReviewDate) return false
    return new Date(nextReviewDate) < new Date()
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {client.name}
          </h1>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}>
            {client.onboarding_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280' }}>
          <span><strong>Entity ID:</strong> {client.legal_entity_id}</span>
          <span><strong>Jurisdiction:</strong> {client.jurisdiction}</span>
          <span><strong>Entity Type:</strong> {client.entity_type}</span>
          <span><strong>RM:</strong> {client.assigned_rm}</span>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Onboarding Progress Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
            Onboarding Progress
          </h2>

          <div style={{ position: 'relative' }}>
            {/* Progress Line */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              height: '2px',
              backgroundColor: '#e5e7eb',
              zIndex: 0,
            }} />

            {/* Stages */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', position: 'relative', zIndex: 1 }}>
              {STAGES.map((stageName) => {
                const stage = stages.find(s => s.stage_name === stageName)
                const status = stage?.status || 'not_started'
                const color = getStageStatusColor(status)
                const isActive = status === 'in_progress'

                return (
                  <div key={stageName} style={{ textAlign: 'center' }}>
                    {/* Stage Circle */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: isActive ? '3px solid #dbeafe' : 'none',
                      boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
                    }}>
                      {status === 'completed' && (
                        <span style={{ color: 'white', fontSize: '16px' }}>✓</span>
                      )}
                      {status === 'in_progress' && (
                        <span style={{ color: 'white', fontSize: '18px' }}>⟳</span>
                      )}
                      {status === 'blocked' && (
                        <span style={{ color: 'white', fontSize: '16px' }}>!</span>
                      )}
                    </div>

                    {/* Stage Name */}
                    <div style={{
                      fontSize: '11px',
                      color: status === 'not_started' ? '#9ca3af' : '#374151',
                      fontWeight: isActive ? '600' : '400',
                      lineHeight: '1.3',
                    }}>
                      {stageName}
                    </div>

                    {/* Stage Details */}
                    {stage && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                        {stage.assigned_team && <div>{stage.assigned_team}</div>}
                        {stage.notes && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#ef4444' }}>
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
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Regulatory Classifications
            </h2>
            {classifications.some(c => isReviewOverdue(c.next_review_date)) && (
              <div style={{
                padding: '6px 12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                ⚠️ Review Overdue
              </div>
            )}
          </div>

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

        {/* Regime Qualification Summary */}
        {classifications.length > 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Regime Qualification Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.values(RegulatoryFramework).map((framework) => {
                const classification = classifications.find(c => c.framework === framework)
                return (
                  <div
                    key={framework}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: classification ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '6px',
                      border: `1px solid ${classification ? '#86efac' : '#e5e7eb'}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {framework}
                      </div>
                      {classification && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                          {classification.classification}
                        </div>
                      )}
                    </div>
                    <div>
                      {classification ? (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: '#d1fae5',
                          color: '#065f46'
                        }}>
                          ✓ Qualified
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
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
      </div>
    </div>
  )
}
