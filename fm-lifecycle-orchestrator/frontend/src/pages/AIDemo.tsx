import { useState } from 'react';
import { Sparkles, FileText, Upload } from 'lucide-react';
import AIProcessingModal from '../components/AIProcessingModal';
import AIValidationResults from '../components/AIValidationResults';
import { documentsApi } from '../lib/api';
import type { EnhancedValidationResult } from '../types';

export default function AIDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationResult, setValidationResult] = useState<EnhancedValidationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [documentId, setDocumentId] = useState<number | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!selectedFile) return;

    try {
      // 1. Upload document (using Client ID 1 for demo)
      const uploadedDoc = await documentsApi.upload(1, selectedFile, {
        document_category: 'client_confirmation',
        uploaded_by: 'demo@example.com'
      });

      setDocumentId(uploadedDoc.id);

      // 2. Show processing modal
      setIsProcessing(true);

      // 3. Trigger enhanced validation
      const validation: EnhancedValidationResult = await documentsApi.enhancedValidate(uploadedDoc.id);

      // Wait for processing modal to complete its animation
      setTimeout(() => {
        setIsProcessing(false);
        setValidationResult(validation);
        setShowValidation(true);
      }, 100);

    } catch (error) {
      console.error('Upload/validation failed:', error);
      setIsProcessing(false);
      alert('Failed to upload and validate document. Please try again.');
    }
  };

  const handleVerify = async (notes?: string) => {
    if (!documentId) return;

    setIsVerifying(true);
    try {
      await documentsApi.verify(documentId, {
        verified_by: 'demo@example.com',
        notes
      });

      setTimeout(() => {
        setIsVerifying(false);
        setShowValidation(false);
        alert('Document verified successfully!');
        // Reset for next demo
        setSelectedFile(null);
        setValidationResult(null);
        setDocumentId(null);
      }, 500);
    } catch (error) {
      console.error('Verification failed:', error);
      setIsVerifying(false);
      alert('Failed to verify document. Please try again.');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          backgroundColor: '#f3e8ff',
          borderRadius: '16px',
          marginBottom: '16px'
        }}>
          <Sparkles size={48} className="text-accent" />
        </div>
        <h1 className="text-foreground" style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '12px'
        }}>
          AI Document Validation Demo
        </h1>
        <p className="text-muted-foreground" style={{
          fontSize: '16px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Upload a client document to see AI automatically extract key information,
          validate against client data, and provide confidence scores.
        </p>
      </div>

      {/* Upload Section */}
      <div style={{
        backgroundColor: 'white',
        border: '2px dashed #d1d5db',
        borderRadius: '16px',
        padding: '48px 32px',
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        {!selectedFile ? (
          <>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              backgroundColor: '#f3f4f6',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <Upload size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-foreground" style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              Upload Document
            </h3>
            <p className="text-muted-foreground" style={{
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              PDF, DOC, DOCX, JPG, or PNG (max 10MB)
            </p>
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload">
              <div className="bg-accent text-white" style={{
                display: 'inline-block',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                Choose File
              </div>
            </label>
          </>
        ) : (
          <>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <FileText size={24} className="text-success" />
              <div style={{ textAlign: 'left' }}>
                <div className="text-success" style={{
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {selectedFile.name}
                </div>
                <div className="text-success" style={{
                  fontSize: '12px'
                }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setSelectedFile(null)}
                style={{
                  padding: '12px 24px',
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
                onClick={handleUploadAndValidate}
                className="bg-accent text-white"
                style={{
                  padding: '12px 32px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Sparkles size={16} />
                Validate with AI
              </button>
            </div>
          </>
        )}
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {[
          {
            icon: '🔍',
            title: 'Smart Extraction',
            description: 'Automatically extracts legal names, dates, and country of incorporation'
          },
          {
            icon: '📊',
            title: 'Confidence Scores',
            description: 'Each field includes AI confidence level (75-98%)'
          },
          {
            icon: '✅',
            title: 'Auto-Validation',
            description: 'Compares extracted data against client records'
          }
        ].map((feature, idx) => (
          <div
            key={idx}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {feature.icon}
            </div>
            <h4 className="text-foreground" style={{
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {feature.title}
            </h4>
            <p className="text-muted-foreground" style={{
              fontSize: '12px',
              margin: 0
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AIProcessingModal
        isOpen={isProcessing}
        documentName={selectedFile?.name || ''}
        onComplete={() => {
          // Processing complete, validation result will show
        }}
      />

      {showValidation && validationResult && (
        <AIValidationResults
          validation={validationResult}
          onVerify={handleVerify}
          onClose={() => setShowValidation(false)}
          isVerifying={isVerifying}
        />
      )}
    </div>
  );
}
