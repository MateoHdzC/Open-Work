import React, { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { ChatMessageUI } from '../types';

interface ChatAreaProps {
  messages: ChatMessageUI[];
  onConfirm: (confirmationId: string, confirmed: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, onConfirm }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getToolIcon = (name: string) => {
    if (name.includes('command') || name.includes('powershell') || name.includes('cmd')) return Terminal;
    if (name.includes('file') || name.includes('directory')) return FileCode;
    if (name.includes('browser') || name.includes('page')) return Globe;
    return AppWindow;
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      {messages.length === 0 && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'var(--text-muted)',
          maxWidth: '540px',
          margin: '0 auto',
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Terminal size={28} color="var(--accent)" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            OpenWork Workspace Runtime
          </h2>
          <p style={{ fontSize: '13px', lineHeight: '20px', marginBottom: '20px' }}>
            Connected to your selected AI provider. Direct your model to inspect code, open applications (Blender, VS Code), execute terminal scripts, control mouse and keyboard, and verify Windows operations.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%',
            textAlign: 'left',
          }}>
            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Windows Automation</div>
              "Abre Blender y crea un cubo."
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Software Engineering</div>
              "Revisa el proyecto, arregla el build y corre los tests."
            </div>
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.role === 'user';
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
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              padding: '0 4px',
            }}>
              {isUser ? 'YOU' : 'OPENWORK AGENT'}
            </div>

            {/* Bubble */}
            <div style={{
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
            }}>
              {msg.content}
            </div>

            {/* Tool Calls Execution Cards */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ width: '100%', maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {msg.toolCalls.map((tc) => {
                  const ToolIcon = getToolIcon(tc.name);
                  return (
                    <div
                      key={tc.id}
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    >
                      {/* Tool Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
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

                      {/* Parameters Preview */}
                      {tc.parameters && Object.keys(tc.parameters).length > 0 && (
                        <div style={{
                          backgroundColor: 'var(--bg-main)',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          marginBottom: '6px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                          overflowX: 'auto',
                        }}>
                          {JSON.stringify(tc.parameters)}
                        </div>
                      )}

                      {/* Confirmation Prompt Block */}
                      {tc.status === 'Waiting' && (
                        <div style={{
                          marginTop: '8px',
                          padding: '10px',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                        }}>
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
                        <div style={{
                          marginTop: '6px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: tc.verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${tc.verified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          color: tc.verified ? 'var(--status-success)' : 'var(--status-danger)',
                        }}>
                          🛡️ {tc.verificationReality}
                        </div>
                      )}

                      {/* Error output */}
                      {tc.error && (
                        <div style={{
                          marginTop: '6px',
                          color: 'var(--status-danger)',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}>
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
