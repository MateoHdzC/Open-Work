import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Square, Pause, Play } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  status: string;
  isPaused: boolean;
  disabled: boolean;
  hasProviderKey?: boolean;
  activeProviderName?: string;
  onNavigateSettings?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  onStop,
  onPause,
  onResume,
  status,
  isPaused,
  disabled,
  hasProviderKey = true,
  activeProviderName,
  onNavigateSettings,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Web Speech API initialization for real-time voice input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // default to system/Spanish, configurable

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setText((prev) => (prev ? prev + ' ' : '') + currentTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const isWorking = status === 'Thinking' || status === 'Running' || status === 'WaitingForConfirmation';

  return (
    <div style={{
      padding: '16px 24px',
      backgroundColor: 'var(--bg-sidebar)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Warning banner when active provider has no key */}
      {!hasProviderKey && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#fca5a5',
        }}>
          <span>No API Key configured for <strong>{activeProviderName || 'selected provider'}</strong>. Connect your key to interact with models.</span>
          {onNavigateSettings && (
            <button
              onClick={onNavigateSettings}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              Configure in Settings →
            </button>
          )}
        </div>
      )}

      {/* Active working controls bar (when model/tools are running) */}
      {isWorking && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isPaused ? 'var(--status-waiting)' : 'var(--status-running)',
            }} className="custom-pulse" />
            <span style={{ fontWeight: 600 }}>
              Agent is {status}... {isPaused && '(PAUSED)'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isPaused ? (
              <button
                onClick={onResume}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <Play size={12} /> Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--border)',
                  color: '#fff',
                  fontSize: '11px',
                }}
              >
                <Pause size={12} /> Pause
              </button>
            )}

            <button
              onClick={onStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid var(--status-danger)',
                color: 'var(--status-danger)',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Square size={12} fill="currentColor" /> Stop
            </button>
          </div>
        </div>
      )}

      {/* Main text input bar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '8px 12px',
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything or instruct OpenWork to execute actions on Windows..."
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '13px',
            lineHeight: '20px',
            maxHeight: '120px',
            color: 'var(--text-primary)',
          }}
        />

        {/* Voice Dictation Button */}
        <button
          onClick={toggleVoice}
          title={isRecording ? 'Listening (click to stop)' : 'Speak to OpenWork'}
          style={{
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: isRecording ? 'var(--status-danger)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          style={{
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: text.trim() && !disabled ? 'var(--accent)' : 'transparent',
            color: text.trim() && !disabled ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
