import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Client {
  id: number
  name: string
  legal_entity_id: string
  jurisdiction: string
  entity_type: string
  onboarding_status: string
  assigned_rm: string
  current_stage: string | null
}

interface OnboardingStage {
  id: number
  stage_name: string
  status: string
  order: number
}

const STAGES = [
  'Legal Entity Setup',
  'Regulatory Classification',
  'FM Account Request',
  'Static Data Enrichment',
  'SSI Validation',
  'Valuation Setup'
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [allClients, setAllClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedClient, setExpandedClient] = useState<number | null>(null)
  const [clientStages, setClientStages] = useState<Record<number, OnboardingStage[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/clients')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        console.log('Received clients:', data)
        setAllClients(data)
        setFilteredClients(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching clients:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Filter clients based on search and status
  useEffect(() => {
    let result = allClients

    // Apply search filter
    if (searchTerm) {
      result = result.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.legal_entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.onboarding_status === statusFilter)
    }

    setFilteredClients(result)
  }, [searchTerm, statusFilter, allClients])

  // Fetch stages when client is expanded
  const toggleClient = async (clientId: number) => {
    if (expandedClient === clientId) {
      setExpandedClient(null)
    } else {
      setExpandedClient(clientId)

      // Fetch stages if not already loaded
      if (!clientStages[clientId]) {
        try {
          const res = await fetch(`http://localhost:8000/api/clients/${clientId}/onboarding`)
          const stages = await res.json()
          setClientStages(prev => ({ ...prev, [clientId]: stages }))
        } catch (err) {
          console.error('Error fetching stages:', err)
        }
      }
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h2>Error: {error}</h2>
        <p>Check console for details</p>
      </div>
    )
  }

  const stats = {
    total: allClients.length,
    inProgress: allClients.filter(c => c.onboarding_status === 'in_progress').length,
    completed: allClients.filter(c => c.onboarding_status === 'completed').length,
    blocked: allClients.filter(c => c.onboarding_status === 'blocked').length,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '20px 40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Client Onboarding Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Monitor client onboarding progress and stages
        </p>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Clients</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>In Progress</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.inProgress}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Completed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Blocked</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.blocked}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="🔍 Search by client name, entity ID, or jurisdiction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'all' ? '#3b82f6' : '#f3f4f6',
                  color: statusFilter === 'all' ? 'white' : '#374151',
                }}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'in_progress' ? '#3b82f6' : '#f3f4f6',
                  color: statusFilter === 'in_progress' ? 'white' : '#374151',
                }}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('blocked')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'blocked' ? '#ef4444' : '#f3f4f6',
                  color: statusFilter === 'blocked' ? 'white' : '#374151',
                }}
              >
                Blocked
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'completed' ? '#10b981' : '#f3f4f6',
                  color: statusFilter === 'completed' ? 'white' : '#374151',
                }}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Results count */}
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
            Showing {filteredClients.length} of {allClients.length} clients
          </div>
        </div>

        {/* Clients List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Client Onboarding Status
            </h2>
          </div>

          {filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No clients found matching your search
            </div>
          ) : (
            <div>
              {filteredClients.map((client) => {
                const isExpanded = expandedClient === client.id
                const stages = clientStages[client.id] || []
                const statusColors = getStatusColor(client.onboarding_status)

                return (
                  <div key={client.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {/* Client Row */}
                    <div
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                        gap: '16px',
                        alignItems: 'center',
                        backgroundColor: isExpanded ? '#f9fafb' : 'white',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      <div onClick={() => toggleClient(client.id)}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {client.legal_entity_id}
                        </div>
                      </div>
                      <div onClick={() => toggleClient(client.id)} style={{ fontSize: '14px', color: '#374151' }}>{client.jurisdiction}</div>
                      <div onClick={() => toggleClient(client.id)} style={{ fontSize: '13px', color: '#6b7280' }}>{client.entity_type}</div>
                      <div onClick={() => toggleClient(client.id)}>
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
                      <div onClick={() => toggleClient(client.id)} style={{ fontSize: '13px', color: '#6b7280' }}>{client.assigned_rm}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => navigate(`/client/${client.id}`)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                        <div
                          onClick={() => toggleClient(client.id)}
                          style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Stage Timeline */}
                    {isExpanded && (
                      <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>
                          Onboarding Progress
                        </h3>

                        {stages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                            Loading stages...
                          </div>
                        ) : (
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

                                    {/* Stage Status */}
                                    <div style={{
                                      fontSize: '10px',
                                      color: '#6b7280',
                                      marginTop: '4px',
                                      textTransform: 'capitalize',
                                    }}>
                                      {status.replace('_', ' ')}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Legend */}
                            <div style={{
                              marginTop: '24px',
                              padding: '12px',
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              display: 'flex',
                              gap: '20px',
                              fontSize: '12px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                <span style={{ color: '#6b7280' }}>Completed</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                <span style={{ color: '#6b7280' }}>In Progress</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                <span style={{ color: '#6b7280' }}>Blocked</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#d1d5db' }} />
                                <span style={{ color: '#6b7280' }}>Not Started</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
