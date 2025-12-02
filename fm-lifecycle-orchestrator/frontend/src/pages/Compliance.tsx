import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'

interface ComplianceOverview {
  total_clients_classified: number
  pending_classifications: number
  upcoming_reviews: {
    next_30_days: number
    next_60_days: number
    next_90_days: number
  }
  regime_coverage: Record<string, number>
  data_quality_summary: {
    excellent: number
    good: number
    needs_improvement: number
  }
}

interface DataQualityAlert {
  client_id: number
  client_name: string
  client_legal_entity_id: string
  client_country: string
  regime: string
  is_eligible: boolean
  data_quality_score: number
  matched_rules: string[]
  unmatched_rules: string[]
  eligibility_reason: string
}

export default function Compliance() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'quality'>('overview')
  const [overview, setOverview] = useState<ComplianceOverview | null>(null)
  const [qualityAlerts, setQualityAlerts] = useState<DataQualityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState<number>(85)

  // Fetch compliance overview
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/regulatory/compliance-overview')
        if (response.ok) {
          const data = await response.json()
          setOverview(data)
        }
      } catch (error) {
        console.error('Failed to fetch compliance overview:', error)
      }
    }

    fetchOverview()
  }, [])

  // Fetch quality alerts when threshold changes
  useEffect(() => {
    const fetchQualityAlerts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://localhost:8000/api/regulatory/data-quality-alerts?threshold=${threshold}`)
        if (response.ok) {
          const data = await response.json()
          setQualityAlerts(data)
        }
      } catch (error) {
        console.error('Failed to fetch quality alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQualityAlerts()
  }, [threshold])

  // Group alerts by client
  const alertsByClient = qualityAlerts.reduce((acc, alert) => {
    if (!acc[alert.client_id]) {
      acc[alert.client_id] = {
        client_name: alert.client_name,
        client_legal_entity_id: alert.client_legal_entity_id,
        client_country: alert.client_country,
        client_id: alert.client_id,
        alerts: []
      }
    }
    acc[alert.client_id].alerts.push(alert)
    return acc
  }, {} as Record<number, { client_name: string; client_legal_entity_id: string; client_country: string; client_id: number; alerts: DataQualityAlert[] }>)

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-success'
    if (score >= 70) return 'text-warning'
    return 'text-destructive'
  }

  const getQualityLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Shield size={24} className="text-info" />
          <h1 className="text-foreground" style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            Compliance Overview
          </h1>
        </div>
        <p className="text-muted-foreground" style={{ fontSize: '16px', margin: 0 }}>
          Regulatory classification management and compliance monitoring across all clients
        </p>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px 12px 0 0', border: '2px solid #e5e7eb', borderBottom: 'none' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'text-info' : 'text-muted-foreground'}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? 'white' : '#f9fafb',
                borderBottom: activeTab === 'overview' ? '3px solid #3b82f6' : '3px solid transparent',
                fontWeight: activeTab === 'overview' ? '600' : '400',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={activeTab === 'quality' ? 'text-info' : 'text-muted-foreground'}
              style={{
                flex: 1,
                padding: '16px 24px',
                border: 'none',
                backgroundColor: activeTab === 'quality' ? 'white' : '#f9fafb',
                borderBottom: activeTab === 'quality' ? '3px solid #3b82f6' : '3px solid transparent',
                fontWeight: activeTab === 'quality' ? '600' : '400',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Data Quality Alerts
              {qualityAlerts.length > 0 && (
                <span className="bg-destructive text-white" style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {qualityAlerts.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '32px' }}>
          {activeTab === 'overview' && overview && (
            <div>
              {/* Summary Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>Total Clients Classified</p>
                      <p className="text-foreground" style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                        {overview.total_clients_classified}
                      </p>
                    </div>
                    <FileText size={48} className="text-info" style={{ opacity: 0.3 }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#fef3c7', padding: '24px', borderRadius: '12px', border: '2px solid #fbbf24' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="text-warning" style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>Reviews Due (30 days)</p>
                      <p className="text-warning" style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                        {overview.upcoming_reviews.next_30_days}
                      </p>
                    </div>
                    <Clock size={48} className="text-warning" style={{ opacity: 0.3 }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#dcfce7', padding: '24px', borderRadius: '12px', border: '2px solid #16a34a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="text-success" style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>Excellent Data Quality</p>
                      <p className="text-success" style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                        {overview.data_quality_summary.excellent}
                      </p>
                    </div>
                    <CheckCircle size={48} className="text-success" style={{ opacity: 0.3 }} />
                  </div>
                </div>

                <div style={{ backgroundColor: '#fee2e2', padding: '24px', borderRadius: '12px', border: '2px solid #dc2626' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p className="text-destructive" style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>Needs Improvement</p>
                      <p className="text-destructive" style={{ fontSize: '36px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
                        {overview.data_quality_summary.needs_improvement}
                      </p>
                    </div>
                    <AlertTriangle size={48} className="text-destructive" style={{ opacity: 0.3 }} />
                  </div>
                </div>
              </div>

              {/* Regime Coverage */}
              <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                <h3 className="text-foreground" style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0' }}>
                  Regime Coverage
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {Object.entries(overview.regime_coverage).map(([regime, count]) => (
                    <div key={regime} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{regime}</span>
                      <span className="text-info bg-info/10" style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        padding: '4px 12px',
                        borderRadius: '12px'
                      }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div>
              {/* Quality Threshold Selector */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Quality Threshold:
                </label>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value={100}>Below 100%</option>
                  <option value={90}>Below 90%</option>
                  <option value={85}>Below 85%</option>
                  <option value={70}>Below 70%</option>
                </select>
                <span className="text-muted-foreground" style={{ fontSize: '14px' }}>
                  Showing {qualityAlerts.length} regime{qualityAlerts.length !== 1 ? 's' : ''} below {threshold}% data quality
                </span>
              </div>

              {/* Quality Alerts */}
              {loading ? (
                <div className="text-muted-foreground" style={{ textAlign: 'center', padding: '60px' }}>
                  Loading data quality alerts...
                </div>
              ) : Object.keys(alertsByClient).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <CheckCircle size={48} className="text-success" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
                    No Quality Issues Found
                  </h3>
                  <p className="text-muted-foreground" style={{ fontSize: '16px' }}>
                    All regimes meet the {threshold}% data quality threshold
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.values(alertsByClient).map(({ client_name, client_legal_entity_id, client_country, client_id, alerts }) => (
                    <div key={client_id} style={{
                      backgroundColor: '#f9fafb',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      {/* Client Header */}
                      <div style={{
                        padding: '16px 20px',
                        backgroundColor: 'white',
                        borderBottom: '2px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <button
                            onClick={() => navigate(`/client/${client_id}`)}
                            className="text-info"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '16px',
                              padding: 0
                            }}
                          >
                            {client_name}
                          </button>
                          <p className="text-muted-foreground" style={{ fontSize: '14px', margin: '4px 0 0 0' }}>
                            {client_legal_entity_id} • {client_country}
                          </p>
                        </div>
                        <div className="bg-destructive/10 text-destructive" style={{
                          padding: '6px 16px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {alerts.length} regime{alerts.length !== 1 ? 's' : ''} below threshold
                        </div>
                      </div>

                      {/* Regime Alerts */}
                      <div style={{ padding: '16px 20px' }}>
                        {alerts.map((alert, index) => (
                          <div key={index} style={{
                            backgroundColor: 'white',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: index < alerts.length - 1 ? '12px' : 0,
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                              <div>
                                <h4 className="text-foreground" style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                                  {alert.regime}
                                </h4>
                                <p className="text-muted-foreground" style={{ fontSize: '14px', margin: '4px 0 0 0' }}>
                                  {alert.is_eligible ? 'Eligible' : 'Not Eligible'}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div className={getQualityColor(alert.data_quality_score)} style={{
                                  fontSize: '24px',
                                  fontWeight: 'bold'
                                }}>
                                  {alert.data_quality_score}%
                                </div>
                                <div className={getQualityColor(alert.data_quality_score)} style={{
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {getQualityLabel(alert.data_quality_score)}
                                </div>
                              </div>
                            </div>

                            {/* Matched/Unmatched Rules */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                  Matched Rules ({alert.matched_rules?.length || 0})
                                </p>
                                {alert.matched_rules && alert.matched_rules.length > 0 ? (
                                  <div className="text-success" style={{ fontSize: '13px' }}>
                                    {alert.matched_rules.map((rule, i) => (
                                      <div key={i} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={16} />
                                        <span>{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground" style={{ fontSize: '13px' }}>No rules matched</p>
                                )}
                              </div>

                              <div>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                                  Unmatched Rules ({alert.unmatched_rules?.length || 0})
                                </p>
                                {alert.unmatched_rules && alert.unmatched_rules.length > 0 ? (
                                  <div className="text-destructive" style={{ fontSize: '13px' }}>
                                    {alert.unmatched_rules.map((rule, i) => (
                                      <div key={i} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertTriangle size={16} />
                                        <span>{rule}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground" style={{ fontSize: '13px' }}>All rules matched</p>
                                )}
                              </div>
                            </div>

                            {/* Eligibility Reason */}
                            {alert.eligibility_reason && (
                              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', margin: '0 0 4px 0' }}>
                                  Reason:
                                </p>
                                <p className="text-muted-foreground" style={{ fontSize: '13px', margin: 0 }}>
                                  {alert.eligibility_reason}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
