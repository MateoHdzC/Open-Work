import React from 'react';
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
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onNewChat: () => void;
  isAgentMode: boolean;
  onToggleMode: (isAgent: boolean) => void;
  activeProvider: string;
  activeModel: string;
  status: string;
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
}) => {
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      userSelect: 'none',
    }}>
      {/* App Branding */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)'
          }}>
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.5px' }}>OPENWORK</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Windows Agent Runtime</div>
          </div>
        </div>

        {/* Mode Selector (CHAT vs AGENT) */}
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: '8px',
          display: 'flex',
          border: '1px solid var(--border)',
        }}>
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
      <div style={{ padding: '12px 16px' }}>
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
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
        >
          <Plus size={16} />
          New Session
        </button>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: active ? 'var(--bg-card-hover)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={16} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info: Provider & Engine Status */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status:</span>
          <span style={{
            color: status === 'Running' ? 'var(--status-running)' :
                   status === 'Thinking' ? 'var(--status-thinking)' :
                   status === 'WaitingForConfirmation' ? 'var(--status-waiting)' : 'var(--text-secondary)',
            fontWeight: 600,
          }}>
            ● {status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Cpu size={12} color="var(--text-muted)" />
          <span style={{ textTransform: 'capitalize' }}>{activeProvider}</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px'
          }} title={activeModel}>
            {activeModel}
          </span>
        </div>
      </div>
    </aside>
  );
};
