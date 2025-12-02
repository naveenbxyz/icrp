import type { RegulatoryClassification } from '../types/index.ts'
import { ValidationStatus, RegulatoryFramework } from '../types/index.ts'
import { format } from 'date-fns'

interface RegulatoryClassificationCardProps {
  classification: RegulatoryClassification
}

export default function RegulatoryClassificationCard({ classification }: RegulatoryClassificationCardProps) {
  const getValidationStatusColor = (status: ValidationStatus) => {
    switch (status) {
      case ValidationStatus.VALIDATED: return { classes: 'bg-success/10 text-success', label: 'Complete' }
      case ValidationStatus.REJECTED: return { classes: 'bg-destructive/10 text-destructive', label: 'Rejected' }
      default: return { classes: 'bg-warning/10 text-warning', label: 'Pending' }
    }
  }

  const getFrameworkColor = (framework: RegulatoryFramework) => {
    switch (framework) {
      case RegulatoryFramework.MIFID_II: return { bg: '#dbeafe', text: '#1e40af' }
      case RegulatoryFramework.EMIR: return { bg: '#e0e7ff', text: '#4338ca' }
      case RegulatoryFramework.DODD_FRANK: return { bg: '#fce7f3', text: '#9f1239' }
      default: return { bg: '#f3f4f6', text: '#374151' }
    }
  }

  const isReviewOverdue = (nextReviewDate: string | null) => {
    if (!nextReviewDate) return false
    return new Date(nextReviewDate) < new Date()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const statusInfo = getValidationStatusColor(classification.validation_status)
  const frameworkColors = getFrameworkColor(classification.framework)
  const overdueReview = isReviewOverdue(classification.next_review_date)

  return (
    <div style={{
      border: `2px solid ${overdueReview ? '#fca5a5' : '#e5e7eb'}`,
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: overdueReview ? '#fef2f2' : 'white',
      position: 'relative'
    }}>
      {/* Framework Badge */}
      <div style={{
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: frameworkColors.bg,
        color: frameworkColors.text,
        marginBottom: '12px'
      }}>
        {classification.framework}
      </div>

      {/* Classification Type */}
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        {classification.classification}
      </h3>

      {/* Validation Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Status:</span>
        <span className={`${statusInfo.classes} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Validation Notes */}
      {classification.validation_notes && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          marginBottom: '16px',
          borderLeft: `3px solid ${classification.validation_status === ValidationStatus.REJECTED ? '#ef4444' : '#3b82f6'}`
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
            Notes:
          </div>
          <div style={{ fontSize: '13px', color: '#374151' }}>
            {classification.validation_notes}
          </div>
        </div>
      )}

      {/* Dates Section */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Classification Date</div>
            <div style={{ color: '#111827', fontWeight: '500' }}>
              {formatDate(classification.classification_date)}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', marginBottom: '4px' }}>Last Review</div>
            <div style={{ color: '#111827', fontWeight: '500' }}>
              {formatDate(classification.last_review_date)}
            </div>
          </div>
        </div>

        {/* Next Review Date with Alert */}
        {classification.next_review_date && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            backgroundColor: overdueReview ? '#fee2e2' : '#f0fdf4',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                Next Review Date
              </div>
              <div style={{ fontSize: '13px', color: '#111827', fontWeight: '600' }}>
                {formatDate(classification.next_review_date)}
              </div>
            </div>
            {overdueReview && (
              <div style={{
                padding: '4px 8px',
                backgroundColor: '#991b1b',
                color: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                OVERDUE
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Count */}
      <div style={{
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <span>📄</span>
        <span>{classification.document_count} supporting document{classification.document_count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
