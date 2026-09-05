import React, { useState, useEffect } from 'react';
import { FolderGit2, FolderOpen, RefreshCw, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';

interface WorkspaceViewProps {
  workspaceRoot: string;
  onSelectWorkspace: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ workspaceRoot, onSelectWorkspace }) => {
  const [info, setInfo] = useState<{ workspaceRoot: string; stack: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const res = await (window as any).openwork.workspace.getInfo();
      setInfo(res);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceRoot]);

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Active Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Directory where the agent reads files, inspects Git, runs builds, and writes code.
            </p>
          </div>
          <button
            onClick={fetchWorkspace}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'custom-pulse' : ''} />
            Refresh
          </button>
        </div>

        {/* Current Path Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
              Filesystem Location
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {workspaceRoot}
            </div>
          </div>
          <button
            onClick={onSelectWorkspace}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <FolderOpen size={16} />
            Select Folder
          </button>
        </div>

        {/* Detected Tech Stack Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderGit2 size={18} color="var(--accent)" />
            Automated Environment Detection
          </h2>

          {info?.stack ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project Languages & Runtimes:</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {info.stack.types.length > 0 ? (
                    info.stack.types.map((t: string) => (
                      <span key={t} style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: 'var(--accent)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}>
                        {t}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Standard Windows Directory</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Version Control:</span>
                <div style={{ marginTop: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {info.stack.hasGit ? (
                    <span style={{ color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Git Repository Connected
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> No Git repository initialized
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Detected Configuration Files:</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {info.stack.filesFound.map((f: string) => (
                    <span key={f} style={{
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <FileCode size={12} /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scanning workspace...</div>
          )}
        </div>
      </div>
    </div>
  );
};
