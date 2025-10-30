import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, XCircle, Clock, Upload, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import DocumentUploadModal from '../components/DocumentUploadModal'
import {
  RegulatoryFramework,
  DocumentCategory
} from '../types'
import type {
  Client,
  RegulatoryClassification,
  RegulatoryDocumentRequirement,
  ClientDocumentStatus,
  DocumentRequirementStatus
} from '../types'

// Mock data for document requirements based on regulatory classification
const REGULATORY_REQUIREMENTS: Record<string, RegulatoryDocumentRequirement[]> = {
  'MiFID II_Professional Client': [
    {
      id: 'mifid2-prof-1',
      framework: RegulatoryFramework.MIFID_II,
      classification: 'Professional Client',
      documentCategory: DocumentCategory.CLIENT_CONFIRMATION,
      categoryLabel: 'Client Confirmation Letter',
      description: 'Signed confirmation from client accepting professional categorization',
      isMandatory: true,
      validityPeriodDays: 365
    },
    {
      id: 'mifid2-prof-2',
      framework: RegulatoryFramework.MIFID_II,
      classification: 'Professional Client',
      documentCategory: DocumentCategory.FINANCIAL_STATEMENTS,
      categoryLabel: 'Financial Statements',
      description: 'Audited financial statements for the last fiscal year',
      isMandatory: true,
      validityPeriodDays: 365
    },
    {
      id: 'mifid2-prof-3',
      framework: RegulatoryFramework.MIFID_II,
      classification: 'Professional Client',
      documentCategory: DocumentCategory.REGISTRATION_CERTIFICATE,
      categoryLabel: 'Registration Certificate',
      description: 'Valid business registration or incorporation certificate',
      isMandatory: true,
      validityPeriodDays: null
    },
    {
      id: 'mifid2-prof-4',
      framework: RegulatoryFramework.MIFID_II,
      classification: 'Professional Client',
      documentCategory: DocumentCategory.RM_ATTESTATION,
      categoryLabel: 'RM Attestation',
      description: 'Relationship Manager attestation of client qualification',
      isMandatory: true,
      validityPeriodDays: 180
    }
  ],
  'EMIR_Financial Counterparty': [
    {
      id: 'emir-fc-1',
      framework: RegulatoryFramework.EMIR,
      classification: 'Financial Counterparty',
      documentCategory: DocumentCategory.CLIENT_CONFIRMATION,
      categoryLabel: 'EMIR Classification Acknowledgment',
      description: 'Client acknowledgment of EMIR financial counterparty status',
      isMandatory: true,
      validityPeriodDays: 365
    },
    {
      id: 'emir-fc-2',
      framework: RegulatoryFramework.EMIR,
      classification: 'Financial Counterparty',
      documentCategory: DocumentCategory.ENTITY_DOCUMENTATION,
      categoryLabel: 'Legal Entity Documentation',
      description: 'LEI certificate and entity documentation',
      isMandatory: true,
      validityPeriodDays: null
    },
    {
      id: 'emir-fc-3',
      framework: RegulatoryFramework.EMIR,
      classification: 'Financial Counterparty',
      documentCategory: DocumentCategory.PRODUCT_ELIGIBILITY,
      categoryLabel: 'Product Eligibility Assessment',
      description: 'Documentation of eligible derivative products',
      isMandatory: true,
      validityPeriodDays: 365
    }
  ],
  'Dodd-Frank_Swap Dealer': [
    {
      id: 'df-sd-1',
      framework: RegulatoryFramework.DODD_FRANK,
      classification: 'Swap Dealer',
      documentCategory: DocumentCategory.REGISTRATION_CERTIFICATE,
      categoryLabel: 'CFTC Registration',
      description: 'Valid CFTC registration certificate as Swap Dealer',
      isMandatory: true,
      validityPeriodDays: null
    },
    {
      id: 'df-sd-2',
      framework: RegulatoryFramework.DODD_FRANK,
      classification: 'Swap Dealer',
      documentCategory: DocumentCategory.CLIENT_CONFIRMATION,
      categoryLabel: 'External Business Conduct Standards',
      description: 'Acknowledgment of external business conduct standards',
      isMandatory: true,
      validityPeriodDays: 365
    },
    {
      id: 'df-sd-3',
      framework: RegulatoryFramework.DODD_FRANK,
      classification: 'Swap Dealer',
      documentCategory: DocumentCategory.FINANCIAL_STATEMENTS,
      categoryLabel: 'Capital Adequacy Statement',
      description: 'Documentation proving capital adequacy requirements',
      isMandatory: true,
      validityPeriodDays: 180
    }
  ]
}

export default function RegulatoryDueDiligence() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [classifications, setClassifications] = useState<Record<number, RegulatoryClassification[]>>({})
  const [documentStatuses, setDocumentStatuses] = useState<ClientDocumentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<number | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<{
    clientId: number
    clientName: string
    requirement: RegulatoryDocumentRequirement
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch clients
      const clientsRes = await fetch('http://localhost:8000/api/clients')
      const clientsData: Client[] = await clientsRes.json()
      setClients(clientsData)

      // Fetch classifications for each client
      const classificationsMap: Record<number, RegulatoryClassification[]> = {}
      for (const client of clientsData) {
        try {
          const classRes = await fetch(`http://localhost:8000/api/clients/${client.id}/regulatory-classifications`)
          const classData = await classRes.json()
          classificationsMap[client.id] = classData
        } catch (err) {
          console.error(`Failed to fetch classifications for client ${client.id}`, err)
          classificationsMap[client.id] = []
        }
      }
      setClassifications(classificationsMap)

      // Generate document status summaries
      const statuses = generateDocumentStatuses(clientsData, classificationsMap)
      setDocumentStatuses(statuses)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateDocumentStatuses = (
    clients: Client[],
    classifications: Record<number, RegulatoryClassification[]>
  ): ClientDocumentStatus[] => {
    const statuses: ClientDocumentStatus[] = []

    for (const client of clients) {
      const clientClassifications = classifications[client.id] || []

      for (const classification of clientClassifications) {
        const key = `${classification.framework}_${classification.classification}`
        const requirements = REGULATORY_REQUIREMENTS[key] || []

        // Generate mock document statuses
        const requirementStatuses: DocumentRequirementStatus[] = requirements.map(req => {
          // Randomly determine if document is uploaded (for demo)
          const hasDocument = Math.random() > 0.4
          const status: DocumentRequirementStatus['status'] = hasDocument
            ? (Math.random() > 0.8 ? 'expired' : 'compliant')
            : 'missing'

          return {
            requirement: req,
            documents: [],
            status,
            latestDocument: undefined,
            expiryDate: undefined
          }
        })

        const totalRequirements = requirementStatuses.length
        const compliantCount = requirementStatuses.filter(r => r.status === 'compliant').length
        const compliancePercentage = totalRequirements > 0
          ? Math.round((compliantCount / totalRequirements) * 100)
          : 0

        const missingMandatory = requirementStatuses.filter(
          r => r.status === 'missing' && r.requirement.isMandatory
        ).length

        const overdueCount = requirementStatuses.filter(r => r.status === 'expired').length

        statuses.push({
          client_id: client.id,
          client_name: client.name,
          framework: classification.framework,
          classification: classification.classification,
          validation_status: classification.validation_status,
          requirements: requirementStatuses,
          compliance_percentage: compliancePercentage,
          missing_mandatory_count: missingMandatory,
          overdue_count: overdueCount
        })
      }
    }

    return statuses
  }

  const handleUpload = (clientId: number, clientName: string, requirement: RegulatoryDocumentRequirement) => {
    setSelectedRequirement({ clientId, clientName, requirement })
    setUploadModalOpen(true)
  }

  const handleUploadSuccess = () => {
    // Refresh data
    fetchData()
  }

  const getStatusIcon = (status: DocumentRequirementStatus['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle size={18} style={{ color: '#10b981' }} />
      case 'missing':
        return <XCircle size={18} style={{ color: '#ef4444' }} />
      case 'expired':
        return <AlertCircle size={18} style={{ color: '#f59e0b' }} />
      case 'pending_review':
        return <Clock size={18} style={{ color: '#3b82f6' }} />
    }
  }

  const getStatusBadge = (status: DocumentRequirementStatus['status']) => {
    const config = {
      compliant: { bg: '#d1fae5', text: '#065f46', label: 'Compliant' },
      missing: { bg: '#fee2e2', text: '#991b1b', label: 'Missing' },
      expired: { bg: '#fef3c7', text: '#92400e', label: 'Expired' },
      pending_review: { bg: '#dbeafe', text: '#1e40af', label: 'Pending Review' }
    }[status]

    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: '500',
        backgroundColor: config.bg,
        color: config.text
      }}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading regulatory due diligence data...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Error: {error}</h2>
      </div>
    )
  }

  const stats = {
    totalClients: documentStatuses.length,
    fullyCompliant: documentStatuses.filter(s => s.compliance_percentage === 100).length,
    actionRequired: documentStatuses.filter(s => s.missing_mandatory_count > 0).length,
    avgCompliance: documentStatuses.length > 0
      ? Math.round(documentStatuses.reduce((sum, s) => sum + s.compliance_percentage, 0) / documentStatuses.length)
      : 0
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', padding: '20px 40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
          Regulatory Due Diligence
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Monitor regulatory documentation compliance and requirements
        </p>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Classifications</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{stats.totalClients}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Fully Compliant</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.fullyCompliant}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Action Required</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>{stats.actionRequired}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Avg Compliance</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgCompliance}%</div>
          </div>
        </div>

        {/* Client Document Status List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Client Documentation Status
            </h2>
          </div>

          {documentStatuses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No regulatory classifications found
            </div>
          ) : (
            <div>
              {documentStatuses.map((docStatus) => {
                const isExpanded = expandedClient === docStatus.client_id
                const hasIssues = docStatus.missing_mandatory_count > 0 || docStatus.overdue_count > 0

                return (
                  <div
                    key={`${docStatus.client_id}-${docStatus.framework}`}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    {/* Client Row */}
                    <div
                      onClick={() => setExpandedClient(isExpanded ? null : docStatus.client_id)}
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#f9fafb' : 'white',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 120px 120px 40px',
                        gap: '16px',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                          {docStatus.client_name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                          {docStatus.framework} - {docStatus.classification}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${docStatus.compliance_percentage}%`,
                            height: '100%',
                            backgroundColor: docStatus.compliance_percentage === 100 ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          {docStatus.compliance_percentage}% Complete
                        </div>
                      </div>

                      <div>
                        {hasIssues ? (
                          <div style={{ fontSize: '13px' }}>
                            {docStatus.missing_mandatory_count > 0 && (
                              <div style={{ color: '#ef4444', marginBottom: '2px' }}>
                                {docStatus.missing_mandatory_count} missing
                              </div>
                            )}
                            {docStatus.overdue_count > 0 && (
                              <div style={{ color: '#f59e0b' }}>
                                {docStatus.overdue_count} expired
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '13px',
                            color: '#10b981',
                            fontWeight: '500'
                          }}>
                            ✓ All current
                          </span>
                        )}
                      </div>

                      <div>
                        {hasIssues && (
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '12px',
                            fontWeight: '500',
                            borderRadius: '6px',
                            display: 'inline-block'
                          }}>
                            Action Required
                          </span>
                        )}
                      </div>

                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/client/${docStatus.client_id}`)
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          View Client
                        </button>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>

                    {/* Expanded Requirements */}
                    {isExpanded && (
                      <div style={{ padding: '24px', backgroundColor: '#f9fafb' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                          Document Requirements
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {docStatus.requirements.map((reqStatus, idx) => (
                            <div
                              key={idx}
                              style={{
                                backgroundColor: 'white',
                                padding: '16px',
                                borderRadius: '8px',
                                border: reqStatus.requirement.isMandatory && reqStatus.status === 'missing'
                                  ? '2px solid #fca5a5'
                                  : '1px solid #e5e7eb'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    {getStatusIcon(reqStatus.status)}
                                    <div>
                                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                                        {reqStatus.requirement.categoryLabel}
                                        {reqStatus.requirement.isMandatory && (
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
                                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                        {reqStatus.requirement.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {getStatusBadge(reqStatus.status)}

                                  {(reqStatus.status === 'missing' || reqStatus.status === 'expired') && (
                                    <button
                                      onClick={() => handleUpload(
                                        docStatus.client_id,
                                        docStatus.client_name,
                                        reqStatus.requirement
                                      )}
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
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
                                      <Upload size={14} />
                                      Upload
                                    </button>
                                  )}

                                  {reqStatus.status === 'compliant' && (
                                    <button
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <FileText size={14} />
                                      View
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {selectedRequirement && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false)
            setSelectedRequirement(null)
          }}
          clientId={selectedRequirement.clientId}
          clientName={selectedRequirement.clientName}
          requirement={selectedRequirement.requirement}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  )
}
