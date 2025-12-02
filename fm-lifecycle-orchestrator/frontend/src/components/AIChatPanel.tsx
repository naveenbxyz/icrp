import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, X, Loader } from 'lucide-react';
import { chatApi } from '../lib/api';
import type { ChatMessage, ChatSuggestion } from '../types';

interface AIChatPanelProps {
  clientId?: number;
  clientName?: string;
  onClose: () => void;
}

export default function AIChatPanel({ clientId, clientName, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug: Log client context
  console.log('🔍 AIChatPanel - Client Context:', { clientId, clientName });

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, [clientId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSuggestions = async () => {
    try {
      const data = await chatApi.getSuggestions(clientId);
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(messageText, clientId);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        context: {
          topic: response.topic
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update suggestions based on response
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions.map((text: string, idx: number) => ({
          id: `suggestion-${idx}`,
          text,
          category: 'general' as const
        })));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    sendMessage(suggestionText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '24px',
      width: '400px',
      height: '600px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              AI Assistant
            </h3>
            {clientName && (
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                {clientName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            cursor: 'pointer',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f9fafb'
      }}>
        {messages.length === 0 ? (
          <div className="text-muted-foreground" style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <Sparkles size={48} className="text-accent" style={{ margin: '0 auto 16px' }} />
            <h4 className="text-foreground" style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              Welcome to AI Assistant
            </h4>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Ask me anything about client onboarding, documents, compliance, or data quality.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div className={message.role === 'user' ? 'bg-accent text-white' : 'bg-white text-foreground'} style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: '1.5',
                boxShadow: message.role === 'assistant' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
              }}>
                {message.content}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          overflowX: 'auto',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion.text)}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                color: '#374151',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={{
        padding: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => { e.currentTarget.classList.add('border-accent') }}
            onBlur={(e) => {
              e.currentTarget.classList.remove('border-accent')
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={inputValue.trim() && !isLoading ? 'bg-accent text-white' : 'bg-gray-300 text-white'}
            style={{
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim() && !isLoading) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
