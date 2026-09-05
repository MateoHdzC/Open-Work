import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputBar } from './components/InputBar';
import { WorkspaceView } from './components/WorkspaceView';
import { ActivityView } from './components/ActivityView';
import { MemoryView } from './components/MemoryView';
import { SettingsView } from './components/SettingsView';
import { NavigationTab, ChatMessageUI, ActivityStepUI } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('chat');
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [status, setStatus] = useState<string>('Idle');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAgentMode, setIsAgentMode] = useState<boolean>(true);
  const [workspaceRoot, setWorkspaceRoot] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>('openai');
  const [activeModel, setActiveModel] = useState<string>('gpt-4o');
  const [activityLog, setActivityLog] = useState<ActivityStepUI[]>([]);

  useEffect(() => {
    // Initial fetch of settings and workspace
    const init = async () => {
      if (!(window as any).openwork) return;
      try {
        const s = await (window as any).openwork.settings.get();
        if (s) {
          setIsAgentMode(s.isAgentMode ?? true);
          setWorkspaceRoot(s.workspaceRoot || '');
          setActiveProvider(s.activeProviderId || 'openai');
          setActiveModel(s.activeModelId || 'gpt-4o');
          if (s.accentColor) {
            document.documentElement.style.setProperty('--accent', s.accentColor);
          }
        }
      } catch {}
    };
    init();

    // Subscribe to IPC events
    if ((window as any).openwork) {
      const unsubState = (window as any).openwork.agent.onStateChanged((state: any) => {
        setStatus(state.status || (state.isActive ? 'Running' : 'Idle'));
        setIsPaused(state.isPaused || false);
        if (state.workspaceRoot) setWorkspaceRoot(state.workspaceRoot);
        if (state.activityLog) setActivityLog(state.activityLog);
      });

      const unsubActivity = (window as any).openwork.agent.onActivity((step: any) => {
        setActivityLog((prev) => {
          const exists = prev.find((s) => s.id === step.id);
          if (exists) {
            return prev.map((s) => (s.id === step.id ? { ...s, ...step } : s));
          }
          return [...prev, step];
        });

        // Also update the latest assistant message's toolCalls
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          const lastMsg = { ...copy[copy.length - 1] };
          if (lastMsg.role === 'assistant') {
            const toolCalls = lastMsg.toolCalls ? [...lastMsg.toolCalls] : [];
            const tcIndex = toolCalls.findIndex((t) => t.id === step.id);
            const tcItem = {
              id: step.id,
              name: step.toolName,
              parameters: step.parameters,
              status: step.status,
              result: step.result,
              error: step.error,
              verified: step.verified,
              verificationReality: step.verificationReality,
            };
            if (tcIndex >= 0) {
              toolCalls[tcIndex] = tcItem;
            } else {
              toolCalls.push(tcItem);
            }
            lastMsg.toolCalls = toolCalls;
            copy[copy.length - 1] = lastMsg;
          }
          return copy;
        });
      });

      const unsubToken = (window as any).openwork.agent.onToken((token: string) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          const lastMsg = { ...copy[copy.length - 1] };
          if (lastMsg.role === 'assistant') {
            lastMsg.content = (lastMsg.content || '') + token;
            copy[copy.length - 1] = lastMsg;
          }
          return copy;
        });
      });

      return () => {
        unsubState();
        unsubActivity();
        unsubToken();
      };
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessageUI = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantPlaceholder: ChatMessageUI = {
      id: `ast_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      toolCalls: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setStatus('Thinking');

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const finalContent = await (window as any).openwork.agent.run(text, history);

      setMessages((prev) => {
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        if (last.role === 'assistant') {
          last.content = finalContent || last.content;
          copy[copy.length - 1] = last;
        }
        return copy;
      });

      // Optional text-to-speech if configured
      try {
        const cfg = await (window as any).openwork.voice.getConfig();
        if (cfg?.enabled && cfg?.autoSpeak && finalContent) {
          const utterance = new SpeechSynthesisUtterance(finalContent);
          window.speechSynthesis.speak(utterance);
        }
      } catch {}
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        last.content = `Error: ${err.message || 'Execution failed.'}`;
        copy[copy.length - 1] = last;
        return copy;
      });
    }
  };

  const handleStop = async () => {
    await (window as any).openwork.agent.stop();
  };

  const handlePause = async () => {
    await (window as any).openwork.agent.pause();
  };

  const handleResume = async () => {
    await (window as any).openwork.agent.resume();
  };

  const handleToggleMode = async (isAgent: boolean) => {
    setIsAgentMode(isAgent);
    await (window as any).openwork.agent.setMode(isAgent);
  };

  const handleConfirmAction = async (confirmationId: string, confirmed: boolean) => {
    await (window as any).openwork.agent.confirm(confirmationId, confirmed);
  };

  const handleSelectWorkspace = async () => {
    const selected = await (window as any).openwork.workspace.selectDialog();
    if (selected) {
      setWorkspaceRoot(selected);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActivityLog([]);
    setStatus('Idle');
    setCurrentTab('chat');
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onNewChat={handleNewChat}
        isAgentMode={isAgentMode}
        onToggleMode={handleToggleMode}
        activeProvider={activeProvider}
        activeModel={activeModel}
        status={status}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {currentTab === 'chat' && (
          <>
            <ChatArea messages={messages} onConfirm={handleConfirmAction} />
            <InputBar
              onSendMessage={handleSendMessage}
              onStop={handleStop}
              onPause={handlePause}
              onResume={handleResume}
              status={status}
              isPaused={isPaused}
              disabled={status === 'WaitingForConfirmation'}
            />
          </>
        )}

        {currentTab === 'workspace' && (
          <WorkspaceView workspaceRoot={workspaceRoot} onSelectWorkspace={handleSelectWorkspace} />
        )}

        {currentTab === 'activity' && <ActivityView activityLog={activityLog} />}

        {currentTab === 'memory' && <MemoryView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};
