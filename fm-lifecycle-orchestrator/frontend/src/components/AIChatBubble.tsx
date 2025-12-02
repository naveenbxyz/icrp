import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import AIChatPanel from './AIChatPanel';

interface AIChatBubbleProps {
  clientId?: number;
  clientName?: string;
}

export default function AIChatBubble({ clientId, clientName }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <AIChatPanel
          clientId={clientId}
          clientName={clientName}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
