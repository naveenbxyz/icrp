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
        return <CheckCircle size={20} className="text-success" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-warning" />;
      case 'alert':
        return <AlertTriangle size={20} className="text-destructive" />;
      default:
        return <Info size={20} className="text-info" />;
    }
  };

  const getInsightClasses = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-success/10 border-success/30',
          text: 'text-success',
          button: 'border-success/30 hover:bg-success/5'
        };
      case 'warning':
        return {
          container: 'bg-warning/10 border-warning/30',
          text: 'text-warning',
          button: 'border-warning/30 hover:bg-warning/5'
        };
      case 'alert':
        return {
          container: 'bg-destructive/10 border-destructive/30',
          text: 'text-destructive',
          button: 'border-destructive/30 hover:bg-destructive/5'
        };
      default:
        return {
          container: 'bg-info/10 border-info/30',
          text: 'text-info',
          button: 'border-info/30 hover:bg-info/5'
        };
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Sparkles size={48} className="text-accent mx-auto mb-4" />
        <p className="text-muted-foreground">Analyzing data and generating insights...</p>
      </div>
    );
  }

  if (!insightsData) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p className="text-muted-foreground">Failed to load insights. Please try again.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Sparkles size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-foreground m-0">
            AI Insights Dashboard
          </h1>
        </div>
        <p className="text-base text-muted-foreground m-0">
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
              <div className="text-2xl font-bold text-success">
                {insightsData.summary.risk_distribution.low}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {insightsData.summary.risk_distribution.medium}
              </div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {insightsData.summary.risk_distribution.high}
              </div>
              <div className="text-xs text-muted-foreground">High</div>
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
          <div className="text-4xl font-bold text-warning">
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
                    <ArrowUp size={16} className="text-success" />
                  ) : (
                    <ArrowDown size={16} className="text-destructive" />
                  )}
                  <span className={`text-xs font-semibold ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
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
              const classes = getInsightClasses(insight.type);
              return (
                <div key={idx} className={`p-5 ${classes.container} border rounded-xl`}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 className={`text-base font-semibold ${classes.text} m-0`}>
                          {insight.title}
                        </h3>
                        <span className={`text-xs font-semibold uppercase ${classes.text} bg-background px-2 py-1 rounded`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className={`text-sm ${classes.text} opacity-90 mb-3`}>
                        {insight.description}
                      </p>
                      <button className={`px-4 py-2 bg-background border ${classes.button} rounded-md text-sm font-medium ${classes.text} cursor-pointer`}>
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
          <div className="p-5 bg-info/10 border border-info/30 rounded-xl">
            <ul style={{ margin: 0, paddingLeft: '24px' }}>
              {insightsData.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-info mb-2 last:mb-0">
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
