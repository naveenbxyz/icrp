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

      // Fetch stages if not already loaded (includes TAT calculations)
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
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Client Readiness Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
              Monitor client onboarding and regulatory due diligence progress
            </p>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            Last updated: {new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clients</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#10b981' }}>
              <span style={{ fontWeight: '600' }}>Active pipeline</span>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #dbeafe',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Progress</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⏳</div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <span style={{ fontWeight: '600' }}>{stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%</span> of total
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #d1fae5',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>✅</div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>{stats.completed}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <span style={{ fontWeight: '600' }}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span> success rate
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #fee2e2',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blocked</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚫</div>
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>{stats.blocked}</div>
            <div style={{ fontSize: '12px', color: '#ef4444' }}>
              <span style={{ fontWeight: '600' }}>Requires attention</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '32px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Search & Filter Clients</h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '350px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#9ca3af' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by client name, entity ID, or jurisdiction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    fontSize: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Status Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: statusFilter === 'all' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'all' ? '#3b82f6' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#3b82f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'all') {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }
                }}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: statusFilter === 'in_progress' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'in_progress' ? '#3b82f6' : 'white',
                  color: statusFilter === 'in_progress' ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'in_progress') {
                    e.currentTarget.style.backgroundColor = '#dbeafe'
                    e.currentTarget.style.borderColor = '#3b82f6'
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'in_progress') {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }
                }}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('blocked')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: statusFilter === 'blocked' ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'blocked' ? '#ef4444' : 'white',
                  color: statusFilter === 'blocked' ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'blocked') {
                    e.currentTarget.style.backgroundColor = '#fee2e2'
                    e.currentTarget.style.borderColor = '#ef4444'
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'blocked') {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }
                }}
              >
                Blocked
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: statusFilter === 'completed' ? '2px solid #10b981' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'completed' ? '#10b981' : 'white',
                  color: statusFilter === 'completed' ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== 'completed') {
                    e.currentTarget.style.backgroundColor = '#d1fae5'
                    e.currentTarget.style.borderColor = '#10b981'
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== 'completed') {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }
                }}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Results count */}
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: '#111827' }}>Showing {filteredClients.length}</span>
            {filteredClients.length !== allClients.length && (
              <span>of {allClients.length} total clients</span>
            )}
            {filteredClients.length === allClients.length && (
              <span>clients</span>
            )}
          </div>
        </div>

        {/* Clients List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Client Pipeline
              </h2>
              <div style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', fontWeight: '500' }}>
                {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
              </div>
            </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                            Onboarding Progress
                          </h3>
                          {client.cumulative_tat_days && (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                                Cumulative TAT
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                                {client.cumulative_tat_days} days
                              </div>
                              <div style={{ fontSize: '9px', color: '#9ca3af' }}>
                                ({client.cumulative_tat_hours?.toFixed(1)} hours)
                              </div>
                            </div>
                          )}
                        </div>

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
                                const isOverdue = stage?.is_overdue || false

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
                                      border: isActive ? '3px solid #dbeafe' : isOverdue ? '2px solid #fca5a5' : 'none',
                                      boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : isOverdue ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
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
                                      marginBottom: '6px'
                                    }}>
                                      {stageName}
                                    </div>

                                    {/* TAT Display */}
                                    {stage && stage.tat_days !== null && stage.tat_days !== undefined && (
                                      <div style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: isOverdue ? '#dc2626' : '#059669',
                                        marginBottom: '2px',
                                        backgroundColor: isOverdue ? '#fee2e2' : '#d1fae5',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                      }}>
                                        {stage.tat_days}d
                                      </div>
                                    )}

                                    {/* Target TAT */}
                                    {stage && stage.target_tat_hours && (
                                      <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px' }}>
                                        Target: {(stage.target_tat_hours / 24).toFixed(1)}d
                                      </div>
                                    )}

                                    {/* Stage Status */}
                                    <div style={{
                                      fontSize: '10px',
                                      color: '#6b7280',
                                      marginTop: '2px',
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
