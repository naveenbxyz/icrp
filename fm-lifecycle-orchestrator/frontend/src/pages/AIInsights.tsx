import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { insightsApi } from '../lib/api';

interface Insight {
  type: 'success' | 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

interface Trend {
  value: number;
  unit: string;
  change: number;
  direction: 'up' | 'down';
}

interface InsightsSummary {
  summary: {
    total_clients: number;
    onboarding_statuses: Record<string, number>;
    total_documents: number;
    verified_documents: number;
    pending_documents: number;
    verification_rate: number;
    risk_distribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
  insights: Insight[];
  recommendations: string[];
  trends: Record<string, Trend>;
  generated_at: string;
}

export default function AIInsights() {
  const [insightsData, setInsightsData] = useState<InsightsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await insightsApi.getSummary();
      setInsightsData(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'warning':
        return <AlertTriangle size={20} style={{ color: '#f59e0b' }} />;
      case 'alert':
        return <AlertTriangle size={20} style={{ color: '#ef4444' }} />;
      default:
        return <Info size={20} style={{ color: '#3b82f6' }} />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
      case 'warning':
        return { bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
      case 'alert':
        return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' };
      default:
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' };
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Sparkles size={48} style={{ color: '#8b5cf6', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Analyzing data and generating insights...</p>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Failed to load insights. Please try again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={32} style={{ color: '#8b5cf6' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>
            AI Insights Dashboard
          </h1>
        </div>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
          AI-powered analysis of client onboarding, documents, and compliance risks
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
            Total Clients
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#111827' }}>
            {insightsData.summary.total_clients}
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
            Document Verification
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#111827' }}>
            {insightsData.summary.verification_rate}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {insightsData.summary.verified_documents} of {insightsData.summary.total_documents} verified
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
            Risk Distribution
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                {insightsData.summary.risk_distribution.low}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Low</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                {insightsData.summary.risk_distribution.medium}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Medium</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                {insightsData.summary.risk_distribution.high}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>High</div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
            Pending Documents
          </div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: '#f59e0b' }}>
            {insightsData.summary.pending_documents}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Awaiting validation
          </div>
        </div>
      </div>

      {/* Trends */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Trend Analysis
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {Object.entries(insightsData.trends).map(([key, trend]) => (
            <div key={key} style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>
                    {trend.value} <span style={{ fontSize: '14px', fontWeight: '400', color: '#6b7280' }}>{trend.unit}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: trend.direction === 'up' ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '6px'
                }}>
                  {trend.direction === 'up' ? (
                    <ArrowUp size={14} style={{ color: '#10b981' }} />
                  ) : (
                    <ArrowDown size={14} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: trend.direction === 'up' ? '#10b981' : '#ef4444'
                  }}>
                    {Math.abs(trend.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      {insightsData.insights.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Key Insights
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {insightsData.insights.map((insight, idx) => {
              const colors = getInsightColor(insight.type);
              return (
                <div key={idx} style={{
                  padding: '20px',
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: 0 }}>
                          {insight.title}
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          color: colors.text,
                          backgroundColor: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {insight.priority}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: colors.text, margin: '0 0 12px 0', opacity: 0.9 }}>
                        {insight.description}
                      </p>
                      <button style={{
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.text,
                        cursor: 'pointer'
                      }}>
                        {insight.action}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {insightsData.recommendations.length > 0 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            AI Recommendations
          </h2>
          <div style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px'
          }}>
            <ul style={{ margin: 0, paddingLeft: '24px' }}>
              {insightsData.recommendations.map((rec, idx) => (
                <li key={idx} style={{
                  fontSize: '14px',
                  color: '#1e40af',
                  marginBottom: idx < insightsData.recommendations.length - 1 ? '8px' : 0
                }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div style={{ marginTop: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
        Last updated: {new Date(insightsData.generated_at).toLocaleString()}
      </div>
    </div>
  );
}
