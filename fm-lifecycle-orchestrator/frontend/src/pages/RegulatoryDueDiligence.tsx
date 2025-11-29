import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye } from 'lucide-react'
import type { Client, RegimeEligibility, DataQualityResult } from '../types'

interface ClientEligibilityView {
  client: Client
  eligibilities: RegimeEligibility[]
  data_quality: Record<string, DataQualityResult>
}

export default function RegulatoryDueDiligence() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [eligibilities, setEligibilities] = useState<Record<number, RegimeEligibility[]>>({})
  const [dataQuality, setDataQuality] = useState<Record<string, DataQualityResult>>({})
  const [regimes, setRegimes] = useState<string[]>([])
  const [selectedRegime, setSelectedRegime] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch regimes first
      const regimesRes = await fetch('http://localhost:8000/api/regimes')
      const regimesData = await regimesRes.json()
      setRegimes(regimesData)

      // Fetch clients
      const clientsRes = await fetch('http://localhost:8000/api/clients')
      const clientsData: Client[] = await clientsRes.json()
      setClients(clientsData)

      // Fetch eligibilities for each client
      const eligibilitiesMap: Record<number, RegimeEligibility[]> = {}
      const qualityMap: Record<string, DataQualityResult> = {}

      for (const client of clientsData) {
        try {
          const eligRes = await fetch(`http://localhost:8000/api/clients/${client.id}/regime-eligibility`)
          const eligData = await eligRes.json()
          eligibilitiesMap[client.id] = eligData

          // Fetch data quality for each regime this client has eligibility for
          for (const elig of eligData) {
            try {
              const qualityRes = await fetch(`http://localhost:8000/api/clients/${client.id}/data-quality?regime=${elig.regime}`)
              const qualityData = await qualityRes.json()
              qualityMap[`${client.id}_${elig.regime}`] = qualityData
            } catch (err) {
              console.error(`Failed to fetch data quality for client ${client.id}, regime ${elig.regime}`, err)
            }
          }
        } catch (err) {
          console.error(`Failed to fetch eligibility for client ${client.id}`, err)
          eligibilitiesMap[client.id] = []
        }
      }

      setEligibilities(eligibilitiesMap)
      setDataQuality(qualityMap)
    } catch (err: any) {
      console.error('Failed to fetch data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluateClient = async (clientId: number, regime: string) => {
    try {
      setEvaluating(clientId)
      await fetch(`http://localhost:8000/api/clients/${clientId}/evaluate-eligibility?regime=${regime}`, {
        method: 'POST'
      })
      // Refresh data after evaluation
      await fetchData()
    } catch (err) {
      console.error('Failed to evaluate client', err)
    } finally {
      setEvaluating(null)
    }
  }

  const getEligibilityBadge = (isEligible: boolean) => {
    if (isEligible) {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={14} />
          Eligible
        </div>
      )
    } else {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          <XCircle size={14} />
          Not Eligible
        </div>
      )
    }
  }

  const getQualityScoreBadge = (score: number) => {
    let bgColor = '#fee2e2'
    let textColor = '#991b1b'
    let icon = <AlertCircle size={14} />

    if (score >= 80) {
      bgColor = '#d1fae5'
      textColor = '#065f46'
      icon = <CheckCircle2 size={14} />
    } else if (score >= 50) {
      bgColor = '#fef3c7'
      textColor = '#92400e'
      icon = <AlertTriangle size={14} />
    }

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {icon}
        {score.toFixed(0)}% Complete
      </div>
    )
  }

  const filteredClients = clients.filter(client => {
    if (selectedRegime === 'all') return true
    const clientElig = eligibilities[client.id] || []
    return clientElig.some(e => e.regime === selectedRegime)
  })

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading regulatory due diligence data...</h2>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Regulatory Due Diligence - Enhanced
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Monitor regime eligibility and mandatory evidence completeness
            </p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
        {/* Regime Filter */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
            Filter by Regime:
          </label>
          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Regimes</option>
            {regimes.map(regime => (
              <option key={regime} value={regime}>{regime}</option>
            ))}
          </select>
        </div>

        {/* Clients with Regime Eligibility */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredClients.map(client => {
            const clientElig = eligibilities[client.id] || []
            const displayElig = selectedRegime === 'all'
              ? clientElig
              : clientElig.filter(e => e.regime === selectedRegime)

            if (displayElig.length === 0 && selectedRegime !== 'all') return null

            return (
              <div
                key={client.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
              >
                {/* Client Header */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {client.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        {client.country_of_incorporation} | {client.entity_type}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/client/${client.id}`)}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Regime Eligibilities */}
                <div style={{ padding: '20px' }}>
                  {displayElig.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                      No regime evaluations available
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {displayElig.map(elig => {
                        const quality = dataQuality[`${client.id}_${elig.regime}`]

                        return (
                          <div
                            key={elig.id}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '16px',
                              backgroundColor: elig.is_eligible ? '#f0fdf4' : '#fef2f2'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                                  {elig.regime} Regime
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                  {getEligibilityBadge(elig.is_eligible)}
                                  {quality && getQualityScoreBadge(quality.quality_score)}
                                </div>

                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                  {elig.eligibility_reason}
                                </div>

                                {/* Matched and Unmatched Rules */}
                                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', marginBottom: '6px' }}>
                                      ✅ Matched Rules ({elig.matched_rules?.length || 0})
                                    </div>
                                    {elig.matched_rules && elig.matched_rules.length > 0 && (
                                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#374151' }}>
                                        {elig.matched_rules.map((rule, idx) => (
                                          <li key={idx}>{rule.rule_name}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b', marginBottom: '6px' }}>
                                      ❌ Unmatched Rules ({elig.unmatched_rules?.length || 0})
                                    </div>
                                    {elig.unmatched_rules && elig.unmatched_rules.length > 0 && (
                                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#374151' }}>
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
                                    marginTop: '12px',
                                    padding: '12px',
                                    backgroundColor: '#fef3c7',
                                    borderRadius: '6px',
                                    border: '1px solid #fbbf24'
                                  }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                                      ⚠️ Data Quality Warnings
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#78350f' }}>
                                      {quality.warnings.slice(0, 3).map((warning, idx) => (
                                        <li key={idx}>{warning}</li>
                                      ))}
                                      {quality.warnings.length > 3 && (
                                        <li>...and {quality.warnings.length - 3} more</li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleEvaluateClient(client.id, elig.regime)}
                                disabled={evaluating === client.id}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '12px',
                                  backgroundColor: evaluating === client.id ? '#9ca3af' : '#6b7280',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: evaluating === client.id ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <RefreshCw size={14} style={{ animation: evaluating === client.id ? 'spin 1s linear infinite' : 'none' }} />
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
            )
          })}
        </div>

        {filteredClients.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No clients found for the selected regime
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
