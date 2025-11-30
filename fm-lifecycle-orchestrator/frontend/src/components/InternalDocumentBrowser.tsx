import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface Document {
  document_type: string;
  document_name: string;
  document_url: string;
  last_updated: string;
  file_size: string;
}

interface InternalDocumentBrowserProps {
  clientId: number;
  legalEntityId?: string;
  onDocumentUploaded?: () => void;
}

export function InternalDocumentBrowser({ clientId, legalEntityId, onDocumentUploaded }: InternalDocumentBrowserProps) {
  const [sxDocuments, setSxDocuments] = useState<Document[]>([]);
  const [cxDocuments, setCxDocuments] = useState<Document[]>([]);
  const [wxDocuments, setWxDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<{[key: string]: any}>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [clientId, legalEntityId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const entityId = legalEntityId || `ENT${String(clientId).padStart(6, '0')}`;

      // Fetch from all three systems in parallel
      const [sxResponse, cxResponse, wxResponse] = await Promise.all([
        fetch(`http://localhost:8000/api/integrations/sx/${entityId}/documents`),
        fetch(`http://localhost:8000/api/integrations/cx/${entityId}/documents`),
        fetch(`http://localhost:8000/api/integrations/wx/${entityId}/documents`)
      ]);

      const sxData = await sxResponse.json();
      const cxData = await cxResponse.json();
      const wxData = await wxResponse.json();

      setSxDocuments(sxData.documents || []);
      setCxDocuments(cxData.documents || []);
      setWxDocuments(wxData.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents from internal systems');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (doc: Document, sourceSystem: string) => {
    const uploadKey = `${sourceSystem}-${doc.document_type}`;
    setUploadingDoc(uploadKey);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}/documents/from-internal-system`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_system: sourceSystem,
          document_url: doc.document_url,
          document_type: doc.document_type,
          document_name: doc.document_name,
          uploaded_by: 'Relationship Manager'
        })
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Store upload result
      setUploadResults(prev => ({
        ...prev,
        [uploadKey]: result
      }));

      // Notify parent component
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload ${doc.document_name}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'SX': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CX': return 'bg-green-100 text-green-800 border-green-200';
      case 'WX': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderDocumentList = (documents: Document[], systemName: string) => {
    const uploadKey = (doc: Document) => `${systemName}-${doc.document_type}`;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${getSystemColor(systemName)} border`}>
            {systemName} System
          </Badge>
          <span className="text-sm text-gray-500">{documents.length} documents available</span>
        </div>

        {documents.map((doc, idx) => {
          const docKey = uploadKey(doc);
          const isUploading = uploadingDoc === docKey;
          const uploadResult = uploadResults[docKey];

          return (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.document_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Last updated: {doc.last_updated} • Size: {doc.file_size}
                    </div>
                    {uploadResult && (
                      <div className="mt-2">
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-xs text-green-800">
                            Document uploaded and processed with OCR/LLM.
                            Status: {uploadResult.ocr_status}
                            {uploadResult.ai_validation_result && (
                              <span className="ml-2">
                                • Extracted {uploadResult.ai_validation_result.extracted_entities?.length || 0} entities
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleUpload(doc, systemName)}
                  disabled={isUploading || !!uploadResult}
                  className="ml-4"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : uploadResult ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-gray-600">Loading documents from internal systems...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Internal Document Sources</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload documents from SX, CX, or WX systems with automatic OCR/LLM processing
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDocuments}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {sxDocuments.length > 0 && renderDocumentList(sxDocuments, 'SX')}
        {cxDocuments.length > 0 && renderDocumentList(cxDocuments, 'CX')}
        {wxDocuments.length > 0 && renderDocumentList(wxDocuments, 'WX')}

        {sxDocuments.length === 0 && cxDocuments.length === 0 && wxDocuments.length === 0 && !error && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No documents available from internal systems</p>
          </Card>
        )}
      </div>
    </div>
  );
}