import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Folder,
  ExternalLink,
  ChevronRight,
  Home,
} from 'lucide-react';

interface WorkspaceViewProps {
  workspaceRoot: string;
  onSelectWorkspace: () => void;
}

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ workspaceRoot, onSelectWorkspace }) => {
  const [info, setInfo] = useState<{ workspaceRoot: string; stack: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [openStatus, setOpenStatus] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const res = await (window as any).openwork.workspace.getInfo();
      setInfo(res);
    } catch {}
    setLoading(false);
  };

  const loadFiles = async (subPath: string = '') => {
    setLoadingFiles(true);
    try {
      const list = await (window as any).openwork.workspace.listFiles(subPath || undefined);
      const sorted = (list || []).sort((a: FileEntry, b: FileEntry) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sorted);
      setCurrentPath(subPath);
    } catch {
      setFiles([]);
    }
    setLoadingFiles(false);
  };

  useEffect(() => {
    fetchWorkspace();
    loadFiles('');
  }, [workspaceRoot]);

  const handleOpenFile = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      loadFiles(entry.path);
    } else {
      try {
        setOpenStatus(`Opening ${entry.name}...`);
        const res = await (window as any).openwork.workspace.openFile(entry.path);
        if (res.error) {
          setOpenStatus(`Error: ${res.error}`);
        } else {
          setOpenStatus(`Opened ${entry.name} in system.`);
        }
        setTimeout(() => setOpenStatus(null), 3000);
      } catch (err: any) {
        setOpenStatus(`Failed: ${err.message}`);
        setTimeout(() => setOpenStatus(null), 3000);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath || currentPath === workspaceRoot) return [];
    const relative = currentPath.replace(workspaceRoot, '').replace(/^[\\\/]/, '');
    if (!relative) return [];
    return relative.split(/[\\\/]/);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const parts = getBreadcrumbs();
    const targetParts = parts.slice(0, index + 1);
    const target = [workspaceRoot, ...targetParts].join('\\');
    loadFiles(target);
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Active Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Directory where OpenWork inspects files, runs scripts, analyzes codebases, and executes Windows tasks.
            </p>
          </div>
          <button
            onClick={() => {
              fetchWorkspace();
              loadFiles(currentPath);
            }}
            disabled={loading || loadingFiles}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading || loadingFiles ? 'custom-pulse' : ''} />
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
              Root Filesystem Location
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {workspaceRoot || 'No workspace selected'}
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
              cursor: 'pointer',
            }}
          >
            <FolderOpen size={16} />
            Change Folder
          </button>
        </div>

        {/* Real File Explorer Card */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={18} color="var(--accent)" />
              File Explorer
            </h2>
            {openStatus && (
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
                {openStatus}
              </span>
            )}
          </div>

          {/* Breadcrumbs Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'var(--bg-main)',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            marginBottom: '12px',
            fontSize: '12px',
            overflowX: 'auto',
          }}>
            <button
              onClick={() => loadFiles('')}
              style={{
                background: 'none',
                border: 'none',
                color: !currentPath || currentPath === workspaceRoot ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: !currentPath || currentPath === workspaceRoot ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Home size={13} /> root
            </button>

            {getBreadcrumbs().map((crumb, idx) => (
              <React.Fragment key={crumb + idx}>
                <ChevronRight size={12} color="var(--text-muted)" />
                <button
                  onClick={() => handleNavigateBreadcrumb(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: idx === getBreadcrumbs().length - 1 ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: idx === getBreadcrumbs().length - 1 ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Files List Table */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            {loadingFiles ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Reading directory contents...
              </div>
            ) : files.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Empty directory.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, width: '100px' }}>Size</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, width: '150px' }}>Modified</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, width: '60px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const Icon = file.isDirectory ? Folder : FileCode;
                    return (
                      <tr
                        key={file.path || file.name}
                        onClick={() => handleOpenFile(file)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                        }}
                      >
                        <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon size={15} color={file.isDirectory ? 'var(--accent)' : 'var(--text-secondary)'} />
                          <span style={{
                            fontFamily: file.isDirectory ? 'inherit' : 'monospace',
                            color: file.isDirectory ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: file.isDirectory ? 600 : 400,
                          }}>
                            {file.name}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {file.isDirectory ? '—' : formatSize(file.size)}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                          {formatDate(file.modified)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(file);
                            }}
                            title={file.isDirectory ? 'Open folder' : 'Open in system editor'}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <ExternalLink size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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
