import { useState } from 'react';
import type { EnhancedValidationResult, ExtractedEntity } from '../types';
import { Check, AlertTriangle, X, Sparkles, Clock } from 'lucide-react';

interface AIValidationResultsProps {
  validation: EnhancedValidationResult;
  onVerify: (notes?: string) => void;
  onClose: () => void;
  isVerifying?: boolean;
}

export default function AIValidationResults({
  validation,
  onVerify,
  onClose,
  isVerifying = false
}: AIValidationResultsProps) {
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Get confidence color based on threshold
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.90) return '#10b981'; // Green
    if (confidence >= 0.75) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  // Get confidence badge
  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    const color = getConfidenceColor(confidence);

    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        padding: '3px 8px',
        backgroundColor: `${color}15`,
        color: color,
        borderRadius: '12px',
        border: `1px solid ${color}40`
      }}>
        {percentage}%
      </span>
    );
  };

  // Get validation status badge
  const getStatusBadge = () => {
    const statusConfig = {
      verified: {
        color: '#10b981',
        icon: <Check size={14} />,
        label: 'Verified'
      },
      needs_review: {
        color: '#f59e0b',
        icon: <AlertTriangle size={14} />,
        label: 'Needs Review'
      },
      failed: {
        color: '#ef4444',
        icon: <X size={14} />,
        label: 'Failed'
      }
    };

    const config = statusConfig[validation.validation_status];

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: '600',
        padding: '6px 12px',
        backgroundColor: `${config.color}15`,
        color: config.color,
        borderRadius: '8px',
        border: `1.5px solid ${config.color}40`
      }}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  // Render single entity row
  const renderEntityRow = (label: string, entity: ExtractedEntity) => {
    const hasIssues = entity.issues && entity.issues.length > 0;
    const borderColor = entity.matches_expected ? '#10b981' : '#f59e0b';

    return (
      <div key={label} style={{
        padding: '12px',
        backgroundColor: hasIssues ? '#fef3c7' : '#f9fafb',
        borderRadius: '8px',
        border: `1px solid ${hasIssues ? '#fde047' : '#e5e7eb'}`
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr auto',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Label */}
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {label}
          </div>

          {/* Value */}
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#111827',
              marginBottom: '4px'
            }}>
              {entity.value || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not detected</span>}
            </div>

            {entity.expected_value && entity.value !== entity.expected_value && (
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                Expected: <span style={{ fontWeight: '500' }}>{entity.expected_value}</span>
              </div>
            )}

            {hasIssues && (
              <div style={{
                fontSize: '11px',
                color: '#92400e',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertTriangle size={12} />
                {entity.issues.join(', ')}
              </div>
            )}
          </div>

          {/* Confidence & Match Indicator */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            {getConfidenceBadge(entity.confidence)}
            {entity.matches_expected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#10b981',
                fontWeight: '500'
              }}>
                <Check size={12} />
                Match
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#f59e0b',
                fontWeight: '500'
              }}>
                <AlertTriangle size={12} />
                Review
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <Sparkles size={24} style={{ color: '#8b5cf6' }} />
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                AI Document Validation Results
              </h2>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px'
            }}>
              {getStatusBadge()}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <Clock size={14} />
                Processed in {(validation.processing_time_ms / 1000).toFixed(2)}s
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Overall Confidence */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Overall Confidence
              </span>
              {getConfidenceBadge(validation.overall_confidence)}
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${validation.overall_confidence * 100}%`,
                height: '100%',
                backgroundColor: getConfidenceColor(validation.overall_confidence),
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Extracted Entities */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Extracted Information
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                8 entities
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {renderEntityRow('Legal Name', validation.legal_name)}
              {renderEntityRow('Country of Incorporation', validation.country_of_incorporation)}
              {renderEntityRow('Entity Type', validation.entity_type)}
              {renderEntityRow('Document Type', validation.document_type)}
              {renderEntityRow('Issue Date', validation.issue_date)}
              {renderEntityRow('Expiry Date', validation.expiry_date)}
              {renderEntityRow('Signatory', validation.signatory)}
              {renderEntityRow('Document Ref', validation.document_reference)}
            </div>
          </div>

          {/* Issues & Warnings */}
          {(validation.issues.length > 0 || validation.warnings.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              {validation.issues.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#991b1b',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <X size={16} />
                    Issues Found ({validation.issues.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {validation.issues.map((issue, idx) => (
                      <li key={idx} style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#92400e',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={16} />
                    Warnings ({validation.warnings.length})
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {validation.warnings.map((warning, idx) => (
                      <li key={idx} style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {validation.recommendations.length > 0 && (
            <div style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '12px'
              }}>
                AI Recommendations
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validation.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#1e40af', marginBottom: '6px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Notes */}
          {showNotes && (
            <div style={{ marginTop: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Verification Notes (Optional)
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any notes about this verification..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ flex: 1 }}>
            {!showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >
                Add Notes
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              Cancel
            </button>

            <button
              onClick={() => onVerify(verificationNotes || undefined)}
              disabled={isVerifying}
              style={{
                padding: '10px 24px',
                border: 'none',
                backgroundColor: isVerifying ? '#9ca3af' : '#10b981',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isVerifying) e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!isVerifying) e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              <Check size={16} />
              {isVerifying ? 'Verifying...' : 'Verify & Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
