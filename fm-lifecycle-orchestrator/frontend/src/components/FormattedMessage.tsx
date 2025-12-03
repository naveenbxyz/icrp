import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

export default function FormattedMessage({ content, isUser }: FormattedMessageProps) {
  return (
    <div className={`formatted-message ${isUser ? 'user-message' : 'assistant-message'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs with proper spacing
          p: ({ children }) => (
            <p style={{ margin: '0 0 12px 0', lineHeight: '1.6' }}>{children}</p>
          ),

          // Headings with hierarchy
          h1: ({ children }) => (
            <h1 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: '0 0 12px 0',
              color: isUser ? '#fff' : '#1f2937'
            }}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 10px 0',
              color: isUser ? '#fff' : '#374151'
            }}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: isUser ? '#fff' : '#4b5563'
            }}>{children}</h3>
          ),

          // Lists with proper indentation
          ul: ({ children }) => (
            <ul style={{
              margin: '0 0 12px 0',
              paddingLeft: '20px',
              listStyleType: 'disc'
            }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{
              margin: '0 0 12px 0',
              paddingLeft: '20px'
            }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{
              margin: '4px 0',
              lineHeight: '1.6'
            }}>{children}</li>
          ),

          // Code blocks with background
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  style={{
                    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : '#f3f4f6',
                    color: isUser ? '#fff' : '#dc2626',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre style={{
                backgroundColor: isUser ? 'rgba(0, 0, 0, 0.2)' : '#1f2937',
                color: '#e5e7eb',
                padding: '12px',
                borderRadius: '8px',
                margin: '0 0 12px 0',
                overflow: 'auto',
                fontSize: '13px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                lineHeight: '1.5'
              }}>
                <code {...props}>{children}</code>
              </pre>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: `3px solid ${isUser ? 'rgba(255, 255, 255, 0.4)' : '#d1d5db'}`,
              paddingLeft: '12px',
              margin: '0 0 12px 0',
              fontStyle: 'italic',
              color: isUser ? 'rgba(255, 255, 255, 0.9)' : '#6b7280'
            }}>{children}</blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '0 0 12px 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}>{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{
              backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : '#f9fafb',
              fontWeight: '600'
            }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th style={{
              padding: '8px 12px',
              textAlign: 'left',
              borderBottom: `2px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'}`
            }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6'}`
            }}>{children}</td>
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong style={{ fontWeight: '600' }}>{children}</strong>
          ),

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: isUser ? '#fff' : '#8b5cf6',
                textDecoration: 'underline',
                fontWeight: '500'
              }}
            >{children}</a>
          ),

          // Horizontal rule
          hr: () => (
            <hr style={{
              border: 'none',
              borderTop: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'}`,
              margin: '16px 0'
            }} />
          )
        }}
      >
        {content}
      </ReactMarkdown>

      <style>{`
        .formatted-message p:last-child {
          margin-bottom: 0;
        }
        .formatted-message ul:last-child,
        .formatted-message ol:last-child {
          margin-bottom: 0;
        }
        .formatted-message pre:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
