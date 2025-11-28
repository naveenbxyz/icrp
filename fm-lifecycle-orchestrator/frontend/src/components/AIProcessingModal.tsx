import { useEffect, useState } from 'react';
import { Loader2, FileText, Brain, CheckCircle2, Sparkles } from 'lucide-react';

interface ProcessingStep {
  label: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

interface AIProcessingModalProps {
  isOpen: boolean;
  documentName: string;
  onComplete?: () => void;
}

export default function AIProcessingModal({
  isOpen,
  documentName,
  onComplete
}: AIProcessingModalProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { label: 'Extracting text from document', status: 'pending' },
    { label: 'Analyzing content with AI', status: 'pending' },
    { label: 'Extracting key entities', status: 'pending' },
    { label: 'Validating against client data', status: 'pending' },
    { label: 'Generating confidence scores', status: 'pending' }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setSteps([
        { label: 'Extracting text from document', status: 'pending' },
        { label: 'Analyzing content with AI', status: 'pending' },
        { label: 'Extracting key entities', status: 'pending' },
        { label: 'Validating against client data', status: 'pending' },
        { label: 'Generating confidence scores', status: 'pending' }
      ]);
      setCurrentStep(0);
      setIsCompleted(false);
      return;
    }

    // Simulate processing steps with realistic delays
    const stepDurations = [600, 800, 700, 500, 400]; // milliseconds

    let stepIndex = 0;
    let timeout: NodeJS.Timeout;

    const processNextStep = () => {
      if (stepIndex >= steps.length) {
        setIsCompleted(true);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
        return;
      }

      // Mark current step as processing
      setSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === stepIndex ? 'processing' as const : step.status
      })));
      setCurrentStep(stepIndex);

      // Complete current step after duration
      timeout = setTimeout(() => {
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === stepIndex ? 'completed' as const : step.status,
          duration: idx === stepIndex ? stepDurations[idx] : step.duration
        })));

        stepIndex++;
        setTimeout(processNextStep, 200); // Small delay between steps
      }, stepDurations[stepIndex]);
    };

    processNextStep();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStepIcon = (step: ProcessingStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle2 size={20} style={{ color: '#10b981' }} />;
    }
    if (step.status === 'processing') {
      return <Loader2 size={20} style={{ color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />;
    }
    return (
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: '600',
        color: '#9ca3af'
      }}>
        {index + 1}
      </div>
    );
  };

  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '500px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <Sparkles size={24} />
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: 0
            }}>
              {isCompleted ? 'Processing Complete!' : 'AI Processing Document'}
            </h2>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            opacity: 0.9,
            marginTop: '8px'
          }}>
            <FileText size={16} />
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {documentName}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ padding: '0 24px', marginTop: '-12px' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Progress
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#e5e7eb',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)',
                transition: 'width 0.3s ease',
                borderRadius: '3px'
              }} />
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div style={{
          padding: '24px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: step.status === 'processing' ? '#faf5ff' : 'transparent',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  border: step.status === 'processing' ? '1px solid #e9d5ff' : '1px solid transparent'
                }}
              >
                {getStepIcon(step, index)}

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: step.status === 'processing' ? '600' : '500',
                    color: step.status === 'completed' ? '#10b981' : step.status === 'processing' ? '#8b5cf6' : '#6b7280'
                  }}>
                    {step.label}
                  </div>
                  {step.status === 'completed' && step.duration && (
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginTop: '2px'
                    }}>
                      Completed in {step.duration}ms
                    </div>
                  )}
                </div>

                {step.status === 'processing' && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#8b5cf6',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {isCompleted && (
          <div style={{
            padding: '20px 24px',
            backgroundColor: '#f0fdf4',
            borderTop: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Brain size={20} style={{ color: '#10b981' }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#065f46'
              }}>
                AI analysis complete
              </div>
              <div style={{
                fontSize: '12px',
                color: '#059669',
                marginTop: '2px'
              }}>
                Review the extracted information to verify accuracy
              </div>
            </div>
          </div>
        )}

        {/* CSS for animations */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  );
}
