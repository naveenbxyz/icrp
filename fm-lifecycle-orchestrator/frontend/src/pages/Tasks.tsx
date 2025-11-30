import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Search, Filter, AlertCircle, CheckCircle, Clock, User } from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string | null
  assigned_to: string | null
  assigned_team: string
  task_type: string
  due_date: string | null
  status: string
  client_id: number
  client_name: string
  client_legal_entity_id: string
  client_country: string
  is_overdue: boolean
  days_until_due: number | null
  created_date: string
}

export default function Tasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [dueDateFilter, setDueDateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Get unique teams for filter dropdown
  const uniqueTeams = Array.from(new Set(tasks.map(t => t.assigned_team).filter(Boolean)))

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (teamFilter !== 'all') params.append('assigned_team', teamFilter)
      if (dueDateFilter !== 'all') params.append('due_date_filter', dueDateFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`http://localhost:8000/api/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')

      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, teamFilter, dueDateFilter])

  // Calculate summary metrics
  const totalOpen = tasks.filter(t => t.status !== 'completed').length
  const overdueTasks = tasks.filter(t => t.is_overdue).length
  const dueThisWeek = tasks.filter(t => t.days_until_due !== null && t.days_until_due >= 0 && t.days_until_due <= 7 && t.status !== 'completed').length
  const completedThisWeek = tasks.filter(t => {
    if (t.status !== 'completed') return false
    const createdDate = new Date(t.created_date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdDate >= weekAgo
  }).length

  // Get status badge style
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', text: 'In Progress' },
      completed: { bg: '#dcfce7', color: '#166534', text: 'Completed' }
    }
    const style = styles[status as keyof typeof styles] || styles.pending
    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    )
  }

  // Format due date with color coding
  const formatDueDate = (task: Task) => {
    if (!task.due_date) return <span style={{ color: '#9ca3af' }}>No due date</span>

    const date = new Date(task.due_date)
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    let color = '#374151'
    if (task.is_overdue) color = '#dc2626'
    else if (task.days_until_due !== null && task.days_until_due <= 3) color = '#f59e0b'

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color }}>
        {task.is_overdue && <AlertCircle size={16} />}
        <span style={{ fontWeight: task.is_overdue ? '600' : '400' }}>{formatted}</span>
        {task.days_until_due !== null && !task.is_overdue && task.days_until_due <= 7 && (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>({task.days_until_due}d)</span>
        )}
      </div>
    )
  }

  const handleSearch = () => {
    fetchTasks()
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setTeamFilter('all')
    setDueDateFilter('all')
    setSearchQuery('')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <ClipboardList size={32} style={{ color: '#3b82f6' }} />
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#111827' }}>
            Task Inbox
          </h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
          Cross-client task management and tracking
        </p>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        {/* Summary Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Total Open Tasks</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#111827' }}>{totalOpen}</p>
              </div>
              <ClipboardList size={40} style={{ color: '#3b82f6' }} />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #fee2e2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>Overdue Tasks</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#dc2626' }}>{overdueTasks}</p>
              </div>
              <AlertCircle size={40} style={{ color: '#dc2626' }} />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #fef3c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>Due This Week</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#f59e0b' }}>{dueThisWeek}</p>
              </div>
              <Clock size={40} style={{ color: '#f59e0b' }} />
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '2px solid #dcfce7' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#166534', fontSize: '14px', margin: 0 }}>Completed This Week</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#16a34a' }}>{completedThisWeek}</p>
              </div>
              <CheckCircle size={40} style={{ color: '#16a34a' }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Filter size={20} style={{ color: '#6b7280' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>Filters</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Status Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Team Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Teams</option>
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Due Date Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Due Date
              </label>
              <select
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Due Dates</option>
                <option value="overdue">Overdue</option>
                <option value="due_this_week">Due This Week</option>
                <option value="due_this_month">Due This Month</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Search
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search tasks or clients..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSearch}
                  style={{
                    padding: '8px 16px',
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
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(statusFilter !== 'all' || teamFilter !== 'all' || dueDateFilter !== 'all' || searchQuery) && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading tasks...</p>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', textAlign: 'center', border: '2px solid #fee2e2' }}>
            <AlertCircle size={48} style={{ color: '#dc2626', margin: '0 auto 16px' }} />
            <p style={{ color: '#dc2626', fontSize: '16px' }}>{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '12px', textAlign: 'center' }}>
            <ClipboardList size={48} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
            <p style={{ color: '#6b7280', fontSize: '16px' }}>No tasks found</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Client
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Task
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Team
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Assigned To
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Due Date
                    </th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr
                      key={task.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb'
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <button
                            onClick={() => navigate(`/client/${task.client_id}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px',
                              textAlign: 'left',
                              padding: 0
                            }}
                          >
                            {task.client_name}
                          </button>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            {task.client_legal_entity_id}
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ maxWidth: '300px' }}>
                          <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827', margin: 0 }}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '14px', color: '#374151' }}>{task.assigned_team}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {task.assigned_to ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: '#6b7280' }} />
                            <span style={{ fontSize: '14px', color: '#374151' }}>{task.assigned_to}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#9ca3af' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {getStatusBadge(task.status)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {formatDueDate(task)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => navigate(`/client/${task.client_id}`)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                          }}
                        >
                          View Client
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
