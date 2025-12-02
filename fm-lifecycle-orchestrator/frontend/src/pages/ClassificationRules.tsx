import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Settings } from 'lucide-react'
import type { ClassificationRule, MandatoryEvidence } from '../types'

export default function ClassificationRules() {
  const [regimes, setRegimes] = useState<string[]>([])
  const [selectedRegime, setSelectedRegime] = useState<string>('')
  const [rules, setRules] = useState<ClassificationRule[]>([])
  const [evidences, setEvidences] = useState<MandatoryEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [retriggering, setRetriggering] = useState(false)
  const [retriggerResult, setRetriggerResult] = useState<any>(null)

  useEffect(() => {
    fetchRegimes()
  }, [])

  useEffect(() => {
    if (selectedRegime) {
      fetchRegimeData(selectedRegime)
    }
  }, [selectedRegime])

  const fetchRegimes = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/regimes')
      const data = await res.json()
      setRegimes(data)
      if (data.length > 0) {
        setSelectedRegime(data[0])
      }
    } catch (err) {
      console.error('Failed to fetch regimes', err)
    }
  }

  const fetchRegimeData = async (regime: string) => {
    try {
      setLoading(true)

      const [rulesRes, evidencesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/regimes/${regime}/rules`),
        fetch(`http://localhost:8000/api/regimes/${regime}/mandatory-evidences`)
      ])

      const rulesData = await rulesRes.json()
      const evidencesData = await evidencesRes.json()

      setRules(rulesData)
      setEvidences(evidencesData)
    } catch (err) {
      console.error('Failed to fetch regime data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetriggerEvaluation = async () => {
    if (!selectedRegime) return

    try {
      setRetriggering(true)
      const res = await fetch(
        `http://localhost:8000/api/regimes/retrigger-evaluation?regime=${selectedRegime}`,
        { method: 'POST' }
      )
      const result = await res.json()
      setRetriggerResult(result)

      setTimeout(() => setRetriggerResult(null), 10000)
    } catch (err) {
      console.error('Failed to retrigger evaluation', err)
    } finally {
      setRetriggering(false)
    }
  }

  const renderRuleConfig = (rule: ClassificationRule) => {
    const config = rule.rule_config

    if (rule.rule_type === 'account_type') {
      return (
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          <div style={{ color: '#059669', marginBottom: '4px' }}>
            <strong>In Scope:</strong> {config.in_scope?.join(', ') || 'None'}
          </div>
          <div style={{ color: '#dc2626' }}>
            <strong>Out of Scope:</strong> {config.out_of_scope?.join(', ') || 'None'}
          </div>
        </div>
      )
    }

    if (rule.rule_type === 'booking_location') {
      return (
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Allowed Locations:</strong> {config.allowed_locations?.join(', ') || 'None'}
          </div>
          <div>
            <strong>Patterns:</strong> {config.allowed_patterns?.join(', ') || 'None'}
          </div>
        </div>
      )
    }

    if (rule.rule_type === 'product_grid') {
      const attrs = config.required_attributes || {}
      return (
        <div style={{ fontSize: '13px', marginTop: '8px' }}>
          {Object.entries(attrs).map(([key, value]: [string, any]) => (
            <div key={key} style={{ marginBottom: '4px' }}>
              <strong>{key.replace(/_/g, ' ')}:</strong> {value.allowed_values?.join(', ') || 'Any'}
            </div>
          ))}
        </div>
      )
    }

    return (
      <pre style={{ fontSize: '12px', background: '#f3f4f6', padding: '8px', borderRadius: '4px', overflow: 'auto' }}>
        {JSON.stringify(config, null, 2)}
      </pre>
    )
  }

  if (loading && !selectedRegime) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading regimes...</h2>
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
              Classification Rules Management
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Configure classification rules and mandatory evidences per regulatory regime
            </p>
          </div>

          <button
            onClick={handleRetriggerEvaluation}
            disabled={retriggering || !selectedRegime}
            style={{
              padding: '10px 20px',
              backgroundColor: retriggering ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: retriggering ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} style={{ animation: retriggering ? 'spin 1s linear infinite' : 'none' }} />
            {retriggering ? 'Re-evaluating...' : 'Re-trigger Evaluation'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Regime Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Select Regime
          </label>
          <select
            value={selectedRegime}
            onChange={(e) => setSelectedRegime(e.target.value)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            {regimes.map(regime => (
              <option key={regime} value={regime}>{regime}</option>
            ))}
          </select>
        </div>

        {/* Retrigger Result */}
        {retriggerResult && (
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
              ✅ Re-evaluation completed for {selectedRegime}
            </div>
            <div style={{ fontSize: '13px', color: '#047857' }}>
              Eligible: {retriggerResult.results_by_regime?.[selectedRegime]?.eligible || 0} |
              Ineligible: {retriggerResult.results_by_regime?.[selectedRegime]?.ineligible || 0}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Classification Rules */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Classification Rules ({rules.length})
              </h2>
              <Settings size={20} className="text-muted-foreground" />
            </div>

            <div style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Loading...</div>
              ) : rules.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No classification rules found for {selectedRegime}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: rule.is_active ? 'white' : '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                            {rule.rule_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Type: {rule.rule_type} | Version: {rule.version}
                          </div>
                        </div>
                        {rule.is_active ? (
                          <CheckCircle size={20} className="text-success" />
                        ) : (
                          <XCircle size={20} className="text-destructive" />
                        )}
                      </div>

                      {rule.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontStyle: 'italic' }}>
                          {rule.description}
                        </div>
                      )}

                      {renderRuleConfig(rule)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mandatory Evidences */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Mandatory Evidences ({evidences.length})
              </h2>
            </div>

            <div style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Loading...</div>
              ) : evidences.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No mandatory evidences found for {selectedRegime}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {evidences.map(evidence => (
                    <div
                      key={evidence.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: evidence.is_active ? 'white' : '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                            {evidence.evidence_name}
                            {evidence.is_mandatory && (
                              <span style={{
                                marginLeft: '8px',
                                padding: '2px 6px',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                fontSize: '10px',
                                borderRadius: '3px',
                                fontWeight: '500'
                              }}>
                                MANDATORY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Category: {evidence.category.replace(/_/g, ' ')}
                          </div>
                        </div>
                        {evidence.is_active ? (
                          <CheckCircle size={20} className="text-success" />
                        ) : (
                          <XCircle size={20} className="text-destructive" />
                        )}
                      </div>

                      {evidence.description && (
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                          {evidence.description}
                        </div>
                      )}

                      {evidence.validity_days && (
                        <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                          Valid for: {evidence.validity_days} days
                        </div>
                      )}
                      {!evidence.validity_days && (
                        <div style={{ fontSize: '12px', color: '#10b981' }}>
                          No expiry
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
