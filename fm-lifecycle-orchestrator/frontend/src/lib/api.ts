const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Clients
export const clientsApi = {
  getAll: (params?: { status?: string; jurisdiction?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.jurisdiction) searchParams.append('jurisdiction', params.jurisdiction);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return fetchAPI(`/api/clients${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => fetchAPI(`/api/clients/${id}`),

  create: (data: any) => fetchAPI('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: number, data: any) => fetchAPI(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: number) => fetchAPI(`/api/clients/${id}`, {
    method: 'DELETE',
  }),

  getRiskScore: (id: number) => fetchAPI(`/api/clients/${id}/risk-score`),
};

// Onboarding
export const onboardingApi = {
  getStages: (clientId: number) => fetchAPI(`/api/clients/${clientId}/onboarding`),

  updateStage: (stageId: number, data: any) => fetchAPI(`/api/onboarding/${stageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Regulatory Classifications
export const regulatoryApi = {
  getClassifications: (clientId: number) => fetchAPI(`/api/clients/${clientId}/regulatory`),

  updateClassification: (classificationId: number, data: any) =>
    fetchAPI(`/api/regulatory/${classificationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  scheduleReview: (classificationId: number, nextReviewDate: string) =>
    fetchAPI(`/api/regulatory/${classificationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ next_review_date: nextReviewDate }),
    }),
};

// Documents
export const documentsApi = {
  getClientDocuments: (clientId: number) => fetchAPI(`/api/clients/${clientId}/documents`),

  getDocument: (documentId: number) => fetchAPI(`/api/documents/${documentId}`),

  upload: async (clientId: number, file: File, data: {
    document_category: string;
    regulatory_classification_id?: number;
    uploaded_by?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_category', data.document_category);
    if (data.regulatory_classification_id) {
      formData.append('regulatory_classification_id', data.regulatory_classification_id.toString());
    }
    if (data.uploaded_by) {
      formData.append('uploaded_by', data.uploaded_by);
    }

    const response = await fetch(`${API_URL}/api/clients/${clientId}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  validate: (documentId: number) => fetchAPI(`/api/documents/${documentId}/validate`, {
    method: 'POST',
  }),

  getValidation: (documentId: number) => fetchAPI(`/api/documents/${documentId}/validation`),

  // Enhanced AI validation with detailed entity extraction
  enhancedValidate: (documentId: number) => fetchAPI(`/api/documents/${documentId}/enhanced-validate`, {
    method: 'POST',
  }),

  getEnhancedValidation: (documentId: number) => fetchAPI(`/api/documents/${documentId}/enhanced-validation`),

  // Verify AI-extracted data
  verify: (documentId: number, data: { verified_by: string; notes?: string }) =>
    fetchAPI(`/api/documents/${documentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (documentId: number) => fetchAPI(`/api/documents/${documentId}`, {
    method: 'DELETE',
  }),
};

// Tasks
export const tasksApi = {
  getClientTasks: (clientId: number) => fetchAPI(`/api/clients/${clientId}/tasks`),

  create: (data: any) => fetchAPI('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (taskId: number, data: any) => fetchAPI(`/api/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (taskId: number) => fetchAPI(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  }),
};

// Integrations (Mock)
export const integrationsApi = {
  getSXEntity: (entityId: string) => fetchAPI(`/api/integrations/sx/${entityId}`),
  getCXClient: (clientId: string) => fetchAPI(`/api/integrations/cx/${clientId}`),
  getEXWorkflow: (requestId: string) => fetchAPI(`/api/integrations/ex/${requestId}`),
};

// Chat
export const chatApi = {
  sendMessage: (message: string, clientId?: number) =>
    fetchAPI('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, client_id: clientId }),
    }),

  getSuggestions: (clientId?: number) =>
    fetchAPI(`/api/chat/suggestions${clientId ? `?client_id=${clientId}` : ''}`),
};

// Insights
export const insightsApi = {
  getSummary: () => fetchAPI('/api/insights/summary'),
};
