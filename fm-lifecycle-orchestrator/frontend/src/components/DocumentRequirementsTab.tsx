import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Clock, Mail, Send, X, FileText, Download } from 'lucide-react'

interface DocumentRequirement {
  id: number
  client_id: number
  regime: string
  evidence_id: number
  evidence_name: string
  evidence_type: string
  category: string
  description: string | null
  is_mandatory: boolean
  validity_days: number | null
  status: string
  document_id: number | null
  document_filename: string | null
  requested_date: string | null
  received_date: string | null
  expiry_date: string | null
  last_reminder_date: string | null
  reminder_count: number
  notes: string | null
}

interface RegimeDocumentStatus {
  regime: string
  total_requirements: number
  compliant_count: number
  missing_count: number
  expired_count: number
  requirements: DocumentRequirement[]
}

interface DocumentSummary {
  client_id: number
  client_name: string
  regimes: string[]
  total_requirements: number
  compliant_count: number
  missing_count: number
  expired_count: number
  pending_review_count: number
  compliance_percentage: number
}

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  clientName: string
  selectedDocuments: DocumentRequirement[]
  onSend: (email: string, cc: string[], subject: string, body: string) => void
}

function EmailModal({ isOpen, onClose, clientId, clientName, selectedDocuments, onSend }: EmailModalProps) {
  const [toEmail, setToEmail] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [subject, setSubject] = useState(`Document Request for ${clientName}`)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen && selectedDocuments.length > 0) {
      // Auto-generate email body
      const docList = selectedDocuments.map(doc =>
        `  - ${doc.evidence_name} (${doc.category}) - ${doc.description || 'Required for ' + doc.regime}`
      ).join('\n')

      const defaultBody = `Dear ${clientName} Team,

As part of your onboarding process, we require the following documents to comply with regulatory requirements:

${docList}

Please upload these documents at your earliest convenience to avoid any delays in account activation.

If you have any questions, please contact your Relationship Manager.

Best regards,
FM Client Readiness Team`

      setBody(defaultBody)
    }
  }, [isOpen, selectedDocuments, clientName])

  const handleSend = async () => {
    setSending(true)
    const ccArray = ccEmails.split(',').map(e => e.trim()).filter(e => e)
    await onSend(toEmail, ccArray, subject, body)
    setSending(false)
    onClose()
  }

  if (!isOpen) return null

  return (
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
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mail size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Request Documents from Client
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                Sending to {clientName} - {selectedDocuments.length} documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              To: *
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="client@example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              CC: (comma-separated)
            </label>
            <input
              type="text"
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              placeholder="rm@bank.com, compliance@bank.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Subject: *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Message: *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !toEmail || !subject || !body}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: sending || !toEmail || !subject || !body ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: sending || !toEmail || !subject || !body ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DocumentRequirementsTabProps {
  clientId: number
  clientName: string
}

export default function DocumentRequirementsTab({ clientId, clientName }: DocumentRequirementsTabProps) {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DocumentSummary | null>(null)
  const [regimes, setRegimes] = useState<RegimeDocumentStatus[]>([])
  const [selectedRegime, setSelectedRegime] = useState<string>('all')
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set())
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchDocumentRequirements()
  }, [clientId])

  const fetchDocumentRequirements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/document-requirements`)
      const data = await response.json()
      setSummary(data.summary)
      setRegimes(data.regimes || [])
    } catch (error) {
      console.error('Failed to fetch document requirements', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await fetch(`http://localhost:8000/api/clients/${clientId}/document-requirements/sync`, {
        method: 'POST'
      })
      await fetchDocumentRequirements()
    } catch (error) {
      console.error('Failed to sync', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleSendEmail = async (email: string, cc: string[], subject: string, body: string) => {
    try {
      const selectedRequirements = Array.from(selectedDocs)
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/send-document-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: email,
          cc_emails: cc,
          subject,
          body,
          document_ids: selectedRequirements
        })
      })

      if (response.ok) {
        alert('Email sent successfully!')
        setSelectedDocs(new Set())
        await fetchDocumentRequirements()
      }
    } catch (error) {
      console.error('Failed to send email', error)
      alert('Failed to send email')
    }
  }

  const handleBulkEmail = async () => {
    const email = prompt('Enter client email address:')
    if (!email) return

    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/send-bulk-document-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: email,
          cc_emails: []
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchDocumentRequirements()
      }
    } catch (error) {
      console.error('Failed to send bulk email', error)
      alert('Failed to send bulk email')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      compliant: { bg: '#d1fae5', text: '#065f46', icon: <CheckCircle2 size={14} />, label: 'Compliant' },
      uploaded: { bg: '#dbeafe', text: '#1e40af', icon: <Clock size={14} />, label: 'Uploaded' },
      missing: { bg: '#fee2e2', text: '#991b1b', icon: <XCircle size={14} />, label: 'Missing' },
      expired: { bg: '#fef3c7', text: '#92400e', icon: <AlertCircle size={14} />, label: 'Expired' },
      pending_review: { bg: '#f3e8ff', text: '#6b21a8', icon: <Clock size={14} />, label: 'Pending Review' }
    }

    const badge = badges[status as keyof typeof badges] || badges.missing

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        backgroundColor: badge.bg,
        color: badge.text,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {badge.icon}
        {badge.label}
      </div>
    )
  }

  const toggleDocSelection = (docId: number) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
        <p>Loading document requirements...</p>
      </div>
    )
  }

  if (!summary || regimes.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '60px 28px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>No Document Requirements Yet</h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
          Document requirements will appear once regime eligibility is evaluated
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: syncing ? 'not-allowed' : 'pointer'
          }}
        >
          {syncing ? 'Syncing...' : 'Sync Document Requirements'}
        </button>
      </div>
    )
  }

  const filteredRegimes = selectedRegime === 'all' ? regimes : regimes.filter(r => r.regime === selectedRegime)
  const selectedRequirements = Array.from(selectedDocs).map(id => {
    for (const regime of regimes) {
      const req = regime.requirements.find(r => r.id === id)
      if (req) return req
    }
    return null
  }).filter(r => r !== null) as DocumentRequirement[]

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>TOTAL REQUIREMENTS</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{summary.total_requirements}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #d1fae5' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>COMPLIANT</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{summary.compliant_count}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>MISSING</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{summary.missing_count}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>EXPIRED</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{summary.expired_count}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>COMPLIANCE</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{summary.compliance_percentage.toFixed(0)}%</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Filter by Regime:</label>
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Regimes ({regimes.length})</option>
              {regimes.map(r => (
                <option key={r.regime} value={r.regime}>{r.regime} ({r.total_requirements})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedDocs.size > 0 && (
              <button
                onClick={() => setIsEmailModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Mail size={16} />
                Request Selected ({selectedDocs.size})
              </button>
            )}
            {summary.missing_count > 0 && (
              <button
                onClick={handleBulkEmail}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Send size={16} />
                Request All Missing
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: syncing ? 'not-allowed' : 'pointer'
              }}
            >
              {syncing ? 'Syncing...' : 'Sync Requirements'}
            </button>
          </div>
        </div>
      </div>

      {/* Document Requirements by Regime */}
      {filteredRegimes.map(regime => (
        <div key={regime.regime} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>{regime.regime} Regime</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                <span><strong>{regime.compliant_count}</strong> Compliant</span>
                <span><strong>{regime.missing_count}</strong> Missing</span>
                <span><strong>{regime.expired_count}</strong> Expired</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Select</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Document Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Uploaded File</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Last Reminder</th>
                </tr>
              </thead>
              <tbody>
                {regime.requirements.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px' }}>
                      {req.status === 'missing' && (
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(req.id)}
                          onChange={() => toggleDocSelection(req.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{req.evidence_name}</div>
                      {req.description && <div style={{ fontSize: '12px', color: '#6b7280' }}>{req.description}</div>}
                      {req.is_mandatory && (
                        <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                          MANDATORY
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>{req.category}</td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: '16px' }}>
                      {req.document_filename ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '13px', color: '#374151' }}>{req.document_filename}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>No file</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                      {req.last_reminder_date ? (
                        <div>
                          {new Date(req.last_reminder_date).toLocaleDateString()}
                          {req.reminder_count > 0 && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              {req.reminder_count} reminder{req.reminder_count > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Not requested</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        clientId={clientId}
        clientName={clientName}
        selectedDocuments={selectedRequirements}
        onSend={handleSendEmail}
      />
    </div>
  )
}
