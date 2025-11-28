import type { RiskScore } from '../types';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RiskBadgeProps {
  riskScore: RiskScore;
  size?: 'small' | 'medium' | 'large';
}

export default function RiskBadge({ riskScore, size = 'medium' }: RiskBadgeProps) {
  const sizeStyles = {
    small: { fontSize: '11px', padding: '4px 8px', iconSize: 14 },
    medium: { fontSize: '13px', padding: '6px 12px', iconSize: 16 },
    large: { fontSize: '15px', padding: '8px 16px', iconSize: 18 }
  };

  const style = sizeStyles[size];

  const getIcon = () => {
    if (riskScore.risk_level === 'low') return <CheckCircle size={style.iconSize} />;
    if (riskScore.risk_level === 'high') return <XCircle size={style.iconSize} />;
    return <AlertTriangle size={style.iconSize} />;
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: style.fontSize,
      fontWeight: '600',
      padding: style.padding,
      backgroundColor: `${riskScore.risk_color}15`,
      color: riskScore.risk_color,
      borderRadius: '8px',
      border: `1.5px solid ${riskScore.risk_color}40`
    }}>
      {getIcon()}
      <span>{riskScore.risk_level.toUpperCase()}</span>
      <span style={{ opacity: 0.8 }}>({Math.round(riskScore.risk_score)})</span>
    </div>
  );
}
