import { useState } from 'react'
import { X, Upload, File } from 'lucide-react'
import type { DocumentCategory, RegulatoryDocumentRequirement } from '../types'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  clientName: string
  requirement: RegulatoryDocumentRequirement
  onUploadSuccess: () => void
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  requirement,
  onUploadSuccess
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadError(null)

    try {
      // Create a dummy file upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('client_id', clientId.toString())
      formData.append('document_category', requirement.documentCategory)
      formData.append('regulatory_framework', requirement.framework)

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real implementation, you would call your API here:
      // const response = await fetch(`http://localhost:8000/api/documents/upload`, {
      //   method: 'POST',
      //   body: formData,
      // })
      // if (!response.ok) throw new Error('Upload failed')

      onUploadSuccess()
      onClose()
      setSelectedFile(null)
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Upload Document
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {clientName} - {requirement.framework}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Requirement Info */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                {requirement.categoryLabel}
                {requirement.isMandatory && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '11px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    MANDATORY
                  </span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                {requirement.description}
              </p>
              {requirement.validityPeriodDays && (
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Valid for: {requirement.validityPeriodDays} days
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                Select Document
              </label>

              <div
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: selectedFile ? '#f0fdf4' : '#fafafa'
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {selectedFile ? (
                  <div>
                    <File size={40} style={{ margin: '0 auto 12px', color: '#10b981' }} />
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={40} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>
                      Click to select a file
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {uploadError && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                {uploadError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              style={{
                padding: '10px 20px',
                backgroundColor: !selectedFile || uploading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
