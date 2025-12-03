import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set PDF.js worker - using local copy for offline use
// Worker copied to public folder for reliable offline access
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Annotation {
  id: number;
  entity_type: string;
  entity_label: string;
  extracted_value: string;
  confidence: number;
  page_number: number;
  bounding_box: BoundingBox;
  status: string;
  corrected_value?: string;
  verified_by?: string;
  verified_at?: string;
}

interface DocumentAnnotationViewerProps {
  documentId: number;
  documentPath: string;
  onClose: () => void;
  onApprove: () => void;
}

export const DocumentAnnotationViewer: React.FC<DocumentAnnotationViewerProps> = ({
  documentId,
  documentPath,
  onClose,
  onApprove
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfScale] = useState(1.5);
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    console.log('📄 DocumentAnnotationViewer mounted');
    console.log('   Document ID:', documentId);
    console.log('   Document Path:', documentPath);
    console.log('   Document Path type:', typeof documentPath);
    console.log('   Document Path starts with /:', documentPath?.startsWith('/'));
    loadAnnotations();
  }, [documentId]);

  const loadAnnotations = async () => {
    console.log('🔄 Loading annotations for document:', documentId);
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8000/api/documents/${documentId}/annotations`;
      console.log('   Fetching:', url);
      const response = await fetch(url);
      console.log('   Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to load annotations: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Annotations loaded:', data.length, 'items');
      console.log('   First annotation:', data[0]);
      setAnnotations(data);
    } catch (error) {
      console.error('❌ Failed to load annotations:', error);
      setError('Failed to load document annotations');
    } finally {
      setLoading(false);
      console.log('   Loading complete, state updated');
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.90) return 'rgb(16, 185, 129)'; // Emerald (softer green)
    if (confidence >= 0.75) return 'rgb(245, 158, 11)'; // Amber (more muted)
    return 'rgb(220, 38, 38)'; // Red (less bright)
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.90) return { label: 'High', color: 'bg-emerald-100 text-emerald-700' };
    if (confidence >= 0.75) return { label: 'Medium', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Low', color: 'bg-red-100 text-red-700' };
  };

  const handleVerify = async (annotationId: number) => {
    setVerifying(annotationId);
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/annotations/${annotationId}/verify`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verified_by: 'Demo User' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to verify annotation');
      }

      // Reload annotations to get updated status
      await loadAnnotations();
    } catch (error) {
      console.error('Failed to verify annotation:', error);
      alert('Failed to verify annotation. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const verifiedCount = annotations.filter(a => a.status === 'verified' || a.status === 'corrected').length;
  const allVerified = annotations.length > 0 && verifiedCount === annotations.length;

  console.log('🎨 Rendering DocumentAnnotationViewer');
  console.log('   Loading:', loading);
  console.log('   Error:', error);
  console.log('   Annotations:', annotations.length);

  if (loading) {
    console.log('   → Showing loading state');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            <span className="text-lg">Loading document annotations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('   → Showing error state');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="text-xs text-gray-500 mb-4">
            <p>Document ID: {documentId}</p>
            <p>Document Path: {documentPath}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  console.log('   → Showing main viewer');

  // Validate and format PDF URL
  if (!documentPath || typeof documentPath !== 'string') {
    console.error('❌ Invalid document path:', documentPath);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Invalid Document Path</h3>
          <p className="text-gray-700 mb-4">
            The document path is invalid or missing: {String(documentPath)}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Ensure PDF path is properly formatted with leading slash
  // Remove ./ prefix if present, then ensure leading /
  let cleanPath = documentPath;
  if (cleanPath.startsWith('./')) {
    cleanPath = cleanPath.substring(1); // Remove the dot, keep the slash
  } else if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath; // Add leading slash if missing
  }

  const pdfUrl = `http://localhost:8000${cleanPath}`;

  console.log('   PDF URL:', pdfUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold">AI Document Review</h2>
            <p className="text-sm text-slate-300">Verify extracted entities from document</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-semibold">{verifiedCount}</span> / {annotations.length} verified
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-slate-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: PDF Viewer with Annotations */}
          <div className="flex-1 p-6 overflow-auto bg-gray-100 relative">
            <div className="relative inline-block bg-white shadow-lg">
              <Document
                file={pdfUrl}
                onLoadSuccess={(pdf) => {
                  console.log('✅ PDF loaded successfully');
                  console.log('   Pages:', pdf.numPages);
                }}
                onLoadError={(error) => {
                  console.error('❌ PDF load error:', error);
                  console.error('   PDF URL:', pdfUrl);
                  setError(`Failed to load PDF document: ${error.message || 'Unknown error'}`);
                }}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
                    <span className="ml-3">Loading PDF...</span>
                  </div>
                }
              >
                <Page
                  pageNumber={1}
                  scale={pdfScale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>

              {/* Annotation Overlays */}
              {annotations.map((annotation) => {
                const isSelected = selectedAnnotation === annotation.id;
                const isVerified = annotation.status === 'verified' || annotation.status === 'corrected';

                return (
                  <div
                    key={annotation.id}
                    className={`absolute border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-slate-600 bg-slate-200 bg-opacity-40 z-10'
                        : isVerified
                        ? 'border-emerald-600 bg-emerald-100 bg-opacity-20'
                        : 'bg-opacity-20'
                    }`}
                    style={{
                      left: `${annotation.bounding_box.x * pdfScale}px`,
                      top: `${annotation.bounding_box.y * pdfScale}px`,
                      width: `${annotation.bounding_box.width * pdfScale}px`,
                      height: `${annotation.bounding_box.height * pdfScale}px`,
                      borderColor: isVerified ? 'rgb(16, 185, 129)' : getConfidenceColor(annotation.confidence),
                      backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.1)' : getConfidenceColor(annotation.confidence),
                    }}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                    title={`${annotation.entity_label}: ${annotation.extracted_value} (${Math.round(annotation.confidence * 100)}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Entity Verification Panel */}
          <div className="w-[400px] border-l bg-gray-50 flex flex-col">
            {/* Progress Bar */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Extracted Entities</h3>
                <span className="text-sm text-gray-600">
                  {verifiedCount} / {annotations.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-slate-500 to-slate-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${annotations.length > 0 ? (verifiedCount / annotations.length) * 100 : 0}%` }}
                >
                  {verifiedCount > 0 && (
                    <span className="text-xs text-white font-semibold">
                      {Math.round((verifiedCount / annotations.length) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Entity Cards */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {annotations.map((annotation) => {
                const badge = getConfidenceBadge(annotation.confidence);
                const isSelected = selectedAnnotation === annotation.id;
                const isVerified = annotation.status === 'verified' || annotation.status === 'corrected';

                return (
                  <div
                    key={annotation.id}
                    className={`bg-white p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-slate-500 shadow-md'
                        : isVerified
                        ? 'border-emerald-200'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedAnnotation(annotation.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {annotation.entity_label}
                      </span>
                      {!isVerified && (
                        <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      {isVerified && (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          ✓ Verified
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {annotation.extracted_value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {Math.round(annotation.confidence * 100)}%
                      </p>
                    </div>

                    {isVerified ? (
                      <div className="flex items-center text-emerald-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified by {annotation.verified_by || 'User'}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerify(annotation.id);
                        }}
                        disabled={verifying === annotation.id}
                        className="w-full py-2 px-4 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {verifying === annotation.id ? 'Verifying...' : 'Verify'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Approve Button */}
            <div className="p-4 border-t bg-white">
              <button
                onClick={onApprove}
                disabled={!allVerified}
                className={`w-full py-3 px-4 rounded font-medium transition-all ${
                  allVerified
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {allVerified ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Approve Document
                  </span>
                ) : (
                  `Verify all entities to approve (${annotations.length - verifiedCount} remaining)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
