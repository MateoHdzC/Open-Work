import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  FileCode,
  Globe,
  AppWindow,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Layers,
} from 'lucide-react';
import { ChatMessageUI, NavigationTab } from '../types';

interface ChatAreaProps {
  messages: ChatMessageUI[];
  status: string;
  hasProviderKey: boolean;
  hasSelectedModel: boolean;
  onNavigateTab: (tab: NavigationTab) => void;
  onConfirm: (confirmationId: string, confirmed: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  status,
  hasProviderKey,
  hasSelectedModel,
  onNavigateTab,
  onConfirm,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const toggleToolExpand = (id: string) => {
    setExpandedTools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getToolIcon = (name: string) => {
    if (name.includes('command') || name.includes('powershell') || name.includes('cmd')) return Terminal;
    if (name.includes('file') || name.includes('directory')) return FileCode;
    if (name.includes('browser') || name.includes('page')) return Globe;
    return AppWindow;
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Configuration Required Banner if no key or model */}
      {!hasProviderKey && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <KeyRound size={20} color="var(--status-danger)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                No AI provider connected
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Connect your OpenAI, Anthropic, Gemini, OpenRouter, or Ollama key to activate OpenWork.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Configure Provider
          </button>
        </div>
      )}

      {hasProviderKey && !hasSelectedModel && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={20} color="var(--status-waiting)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                Select a model to continue
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Choose which model from your connected provider to route instructions to.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Select Model
          </button>
        </div>
      )}

      {/* Empty State when no messages in session */}
      {messages.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'var(--text-muted)',
            maxWidth: '540px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Terminal size={28} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            OpenWork Workspace Runtime
          </h2>
          <p style={{ fontSize: '13px', lineHeight: '20px', marginBottom: '20px' }}>
            Connected to your selected AI provider. Direct your model to inspect code, open applications (Blender, VS Code), execute terminal scripts, control mouse and keyboard, and verify Windows operations.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Windows Automation</div>
              "Abre Blender y crea un cubo."
            </div>
            <div
              style={{
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Software Engineering</div>
              "Revisa el proyecto, arregla el build y corre los tests."
            </div>
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isLatestAssistant = !isUser && index === messages.length - 1;
        const isStreamingThis = isLatestAssistant && (status === 'Thinking' || status === 'Streaming');

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
              gap: '6px',
            }}
          >
            {/* Header / sender */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '0 4px',
              }}
            >
              {isUser ? 'YOU' : 'OPENWORK AGENT'}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                backgroundColor: isUser ? 'var(--accent)' : 'var(--bg-card)',
                border: isUser ? 'none' : '1px solid var(--border)',
                color: '#ffffff',
                fontSize: '13px',
                lineHeight: '22px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
              {isStreamingThis && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '14px',
                    backgroundColor: 'var(--accent)',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                  }}
                  className="custom-pulse"
                />
              )}
            </div>

            {/* Tool Calls Execution Cards */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ width: '100%', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {msg.toolCalls.map((tc) => {
                  const ToolIcon = getToolIcon(tc.name);
                  const isExpanded = expandedTools[tc.id] ?? false;

                  return (
                    <div
                      key={tc.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Tool Header */}
                      <div
                        onClick={() => toggleToolExpand(tc.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                          {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                          <ToolIcon size={14} color="var(--accent)" />
                          <span className="font-mono">{tc.name}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {tc.status === 'Completed' && (
                            <span style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Completed
                            </span>
                          )}
                          {tc.status === 'Failed' && (
                            <span style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={13} /> Failed
                            </span>
                          )}
                          {tc.status === 'Running' && (
                            <span style={{ color: 'var(--status-running)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} className="custom-pulse" /> Running
                            </span>
                          )}
                          {tc.status === 'Waiting' && (
                            <span style={{ color: 'var(--status-waiting)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={13} /> Awaiting Confirmation
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Parameters and Output */}
                      {isExpanded && (
                        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {tc.parameters && Object.keys(tc.parameters).length > 0 && (
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Parameters:</span>
                              <div
                                style={{
                                  backgroundColor: 'var(--bg-main)',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  marginTop: '2px',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  color: 'var(--text-secondary)',
                                  overflowX: 'auto',
                                }}
                              >
                                {JSON.stringify(tc.parameters, null, 2)}
                              </div>
                            </div>
                          )}

                          {tc.result && (
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Result:</span>
                              <div
                                style={{
                                  backgroundColor: 'var(--bg-main)',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  marginTop: '2px',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  color: 'var(--text-secondary)',
                                  maxHeight: '120px',
                                  overflowY: 'auto',
                                }}
                              >
                                {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirmation Prompt Block */}
                      {tc.status === 'Waiting' && (
                        <div
                          style={{
                            margin: '8px 12px 12px 12px',
                            padding: '10px',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-waiting)', fontWeight: 600, marginBottom: '6px' }}>
                            <ShieldAlert size={14} /> Security Confirmation Required
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            This action modifies critical system state. Do you authorize OpenWork to execute it?
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => onConfirm(tc.id, true)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--status-success)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '11px',
                              }}
                            >
                              Authorize
                            </button>
                            <button
                              onClick={() => onConfirm(tc.id, false)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--border)',
                                color: '#fff',
                                fontSize: '11px',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Empirical Verification Reality Tag */}
                      {tc.verificationReality && (
                        <div
                          style={{
                            padding: '4px 12px',
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '11px',
                            backgroundColor: tc.verified ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                            color: tc.verified ? 'var(--status-success)' : 'var(--status-danger)',
                          }}
                        >
                          🛡️ {tc.verificationReality}
                        </div>
                      )}

                      {/* Error output */}
                      {tc.error && (
                        <div
                          style={{
                            padding: '6px 12px',
                            borderTop: '1px solid var(--border-subtle)',
                            color: 'var(--status-danger)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {tc.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
