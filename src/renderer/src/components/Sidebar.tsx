import React, { useState } from 'react';
import {
  MessageSquare,
  FolderGit2,
  Activity,
  BrainCircuit,
  Settings,
  Plus,
  Cpu,
  Bot,
  Zap,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { NavigationTab, ChatSessionSummary } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onNewChat: () => void;
  isAgentMode: boolean;
  onToggleMode: (isAgent: boolean) => void;
  activeProvider: string;
  activeModel: string;
  status: string;
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onNewChat,
  isAgentMode,
  onToggleMode,
  activeProvider,
  activeModel,
  status,
  sessions,
  activeSessionId,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation permanently?')) {
      onDeleteSession(id);
    }
  };

  return (
    <aside
      style={{
        width: '270px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* App Branding */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>OPENWORK</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Windows Agent Runtime</div>
          </div>
        </div>

        {/* Mode Selector (CHAT vs AGENT) */}
        <div
          style={{
            marginTop: '16px',
            background: 'var(--bg-input)',
            padding: '3px',
            borderRadius: '8px',
            display: 'flex',
            border: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => onToggleMode(false)}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              backgroundColor: !isAgentMode ? 'var(--border)' : 'transparent',
              color: !isAgentMode ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare size={13} />
            CHAT
          </button>
          <button
            onClick={() => onToggleMode(true)}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              backgroundColor: isAgentMode ? 'var(--accent)' : 'transparent',
              color: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={13} />
            AGENT
          </button>
        </div>
      </div>

      {/* Action / New Chat */}
      <div style={{ padding: '12px 16px 6px 16px' }}>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 14px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          <Plus size={16} />
          New Session
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ padding: '8px 12px 4px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {[
          { id: 'chat', label: 'Conversation', icon: MessageSquare },
          { id: 'workspace', label: 'Workspace', icon: FolderGit2 },
          { id: 'activity', label: 'Live Activity', icon: Activity },
          { id: 'memory', label: 'Memory Bank', icon: BrainCircuit },
          { id: 'settings', label: 'Settings & Keys', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavigationTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: active ? 'var(--bg-card-hover)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              <Icon size={15} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Real Chat History List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '6px' }}>
          Saved Sessions ({sessions.length})
        </div>

        {sessions.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '12px 6px' }}>
            No saved sessions yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {sessions.map((sess) => {
              const isSelected = sess.id === activeSessionId && currentTab === 'chat';
              const isEditing = sess.id === editingSessionId;

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess.id);
                    onSelectTab('chat');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                    border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        style={{ flex: 1, padding: '2px 6px', fontSize: '11px' }}
                      />
                      <button onClick={(e) => saveRename(sess.id, e)} style={{ color: 'var(--status-success)', padding: '2px' }}>
                        <Check size={13} />
                      </button>
                      <button onClick={cancelRename} style={{ color: 'var(--text-muted)', padding: '2px' }}>
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                        title={sess.title}
                      >
                        {sess.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        <button
                          onClick={(e) => startRename(sess.id, sess.title, e)}
                          title="Rename"
                          style={{ color: 'var(--text-muted)', padding: '2px', display: isSelected ? 'block' : 'none' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(sess.id, e)}
                          title="Delete"
                          style={{ color: 'var(--text-muted)', padding: '2px', display: isSelected ? 'block' : 'none' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info: Provider & Engine Status */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status:</span>
          <span
            style={{
              color:
                status === 'Running'
                  ? 'var(--status-running)'
                  : status === 'Thinking' || status === 'Streaming'
                  ? 'var(--status-thinking)'
                  : status === 'WaitingForConfirmation'
                  ? 'var(--status-waiting)'
                  : 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            ● {status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Cpu size={12} color="var(--text-muted)" />
          <span style={{ textTransform: 'capitalize' }}>{activeProvider}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '130px',
            }}
            title={activeModel}
          >
            {activeModel}
          </span>
        </div>
      </div>
    </aside>
  );
};
