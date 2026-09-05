export function getOpenWorkHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenWork — Autonomous Windows AI Agent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #06080B;
      --bg-sidebar: #090C10;
      --bg-surface: #0E1217;
      --bg-elevated: #151A22;
      --bg-hover: #1C232E;
      --bg-active: #222B38;

      --border-subtle: #1C2533;
      --border-strong: #283548;
      --border-accent: rgba(47, 124, 255, 0.35);

      --accent-primary: #2F7CFF;
      --accent-bright: #478DFF;
      --accent-soft: rgba(47, 124, 255, 0.12);
      --accent-glow: rgba(47, 124, 255, 0.25);

      --text-primary: #F3F6FA;
      --text-secondary: #96A2B4;
      --text-muted: #5C6778;

      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;

      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      --radius-sm: 4px;
      --radius-md: 6px;
      --radius-lg: 10px;
      --radius-xl: 14px;
      --radius-full: 9999px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-family: var(--font-sans);
      height: 100vh;
      display: flex;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent-primary); }

    button, input, textarea, select {
      font-family: inherit;
      color: inherit;
      border: none;
      outline: none;
      background: transparent;
    }

    .app-sidebar {
      width: 260px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      user-select: none;
      z-index: 30;
    }

    .brand-header {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand-icon-svg {
      width: 32px;
      height: 32px;
      color: var(--accent-primary);
    }

    .brand-title-wrap {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #FFFFFF;
    }

    .brand-subtitle {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .nav-group-title {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding: 0 0.5rem;
      margin-bottom: 0.35rem;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.65rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 140ms ease;
    }
    .nav-btn:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }
    .nav-btn.active {
      color: #FFFFFF;
      background: var(--accent-soft);
      border: 1px solid var(--border-accent);
      font-weight: 600;
    }

    .mode-switch-pill {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.25rem;
      gap: 0.25rem;
    }
    .mode-btn {
      padding: 0.4rem;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      text-align: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 140ms ease;
    }
    .mode-btn.active {
      background: var(--accent-primary);
      color: #FFFFFF;
    }

    .sidebar-workspace-box {
      padding: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }
    .ws-pill-btn {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .ws-pill-btn:hover {
      border-color: var(--border-accent);
    }

    .main-stage {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }

    .top-toolbar {
      height: 54px;
      padding: 0 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(6, 8, 11, 0.85);
      backdrop-filter: blur(8px);
      z-index: 20;
    }

    .model-selector-box {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.35rem 0.75rem;
      cursor: pointer;
    }
    .model-selector-box:hover {
      border-color: var(--border-accent);
    }

    .agent-controls-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-control {
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid var(--border-subtle);
    }
    .btn-control.stop {
      background: rgba(239, 68, 68, 0.15);
      border-color: var(--danger);
      color: #FF6B6B;
    }
    .btn-control.stop:hover {
      background: var(--danger);
      color: #FFFFFF;
    }
    .btn-control.voice {
      background: var(--accent-soft);
      border-color: var(--border-accent);
      color: var(--accent-bright);
    }
    .btn-control.voice.active {
      background: var(--accent-primary);
      color: #FFFFFF;
    }

    .stage-split-view {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .conversation-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .messages-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .welcome-hero {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }
    .welcome-hero h1 {
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      color: #FFFFFF;
    }
    .welcome-hero h1 span {
      color: var(--accent-primary);
    }
    .welcome-hero p {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .msg-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      font-size: 0.92rem;
      line-height: 1.6;
    }
    .msg-card.user {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }
    .msg-card.assistant {
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
    }

    .activity-pane {
      width: 340px;
      background: var(--bg-sidebar);
      border-left: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .activity-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .activity-feed {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .activity-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.78rem;
    }
    .activity-item.running {
      border-color: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-soft);
    }
    .activity-status-badge {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      display: inline-block;
      width: max-content;
    }
    .status-running { background: var(--accent-soft); color: var(--accent-bright); }
    .status-completed { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .status-waiting { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .status-failed { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
    .status-paused { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
    .status-cancelled { background: rgba(92, 103, 120, 0.2); color: var(--text-muted); }

    .composer-area {
      padding: 1rem 1.5rem 1.25rem 1.5rem;
    }

    .composer-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: 0.85rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .composer-box:focus-within {
      border-color: var(--accent-primary);
    }

    .composer-input {
      width: 100%;
      height: 32px;
      max-height: 180px;
      resize: none;
      font-size: 0.92rem;
      color: var(--text-primary);
      line-height: 1.5;
    }

    .composer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-send {
      width: 32px;
      height: 32px;
      background: var(--accent-primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      cursor: pointer;
    }
    .btn-send:hover {
      background: var(--accent-bright);
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(6, 8, 11, 0.85);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 140ms ease;
    }
    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-accent);
      border-radius: var(--radius-xl);
      width: 90%;
      max-width: 640px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
    }

    .modal-title-bar {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;
    }

    .modal-body {
      padding: 1.25rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .form-input {
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.6rem 0.85rem;
      font-size: 0.84rem;
      color: #FFFFFF;
    }
  </style>
</head>
<body>

  <aside class="app-sidebar">
    <div class="brand-header">
      <svg class="brand-icon-svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="4" y="4" width="24" height="24" rx="6"/>
        <path d="M10 16h12M16 10v12"/>
      </svg>
      <div class="brand-title-wrap">
        <span class="brand-title">OpenWork</span>
        <span class="brand-subtitle">Autonomous Windows Agent</span>
      </div>
    </div>

    <div class="sidebar-nav">
      <div>
        <div class="nav-group-title">Mode</div>
        <div class="mode-switch-pill">
          <div class="mode-btn active" id="btnModeAgent" onclick="setMode('agent')">Agent</div>
          <div class="mode-btn" id="btnModeChat" onclick="setMode('chat')">Chat</div>
        </div>
      </div>

      <div>
        <div class="nav-group-title">Navigation</div>
        <div class="nav-btn active" id="nav-chat" onclick="showView('chat')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>Workspace Chat</span>
        </div>
        <div class="nav-btn" id="nav-memory" onclick="showView('memory')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>Memory Engine</span>
        </div>
        <div class="nav-btn" id="nav-tools" onclick="showView('tools')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          <span>Tools & Windows API</span>
        </div>
        <div class="nav-btn" id="nav-settings" onclick="showView('settings')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>Settings</span>
        </div>
      </div>
    </div>

    <div class="sidebar-workspace-box">
      <div class="ws-pill-btn" onclick="openWorkspaceModal()">
        <div style="display:flex; flex-direction:column; line-height:1.2;">
          <span style="font-size:0.65rem; color:var(--text-muted);">Workspace</span>
          <span style="font-weight:600; color:#FFFFFF;" id="sidebarWsLabel">Personal</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </div>
  </aside>

  <main class="main-stage">
    <header class="top-toolbar">
      <div class="model-selector-box" onclick="openModelPicker()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
        <span style="font-weight:700; font-size:0.82rem;" id="topbarProvider">OPENAI</span>
        <span style="font-size:0.75rem; font-family:var(--font-mono); color:var(--text-secondary);" id="topbarModel">gpt-4o</span>
        <span style="font-size:0.7rem; color:var(--text-muted);">▾</span>
      </div>

      <div class="agent-controls-row">
        <button class="btn-control voice" id="btnVoiceToggle" onclick="toggleVoice()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>
          <span>Voice</span>
        </button>
        <button class="btn-control stop" onclick="emergencyStop()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          <span>Stop</span>
        </button>
      </div>
    </header>

    <div class="stage-split-view">
      <section class="conversation-pane">
        <div class="messages-scroll" id="messagesList">
          <div class="welcome-hero" id="welcomeHeroBox">
            <h1>Welcome to <span>OpenWork</span></h1>
            <p>Your autonomous AI desktop companion for Windows.</p>
          </div>
        </div>

        <div class="composer-area">
          <div class="composer-box">
            <textarea
              id="promptInput"
              class="composer-input"
              placeholder="Ask OpenWork to run tasks, launch apps, write code, or automate Windows..."
              onkeydown="handleKey(event)"
            ></textarea>
            <div class="composer-bottom">
              <div style="font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted);" id="composerStatusHint">
                Mode: Agent (Full Windows Automation)
              </div>
              <button class="btn-send" onclick="sendPrompt()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside class="activity-pane" id="activityPane">
        <div class="activity-header">
          <span>Agent Activity</span>
          <span style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);" id="activityCounter">0 steps</span>
        </div>
        <div class="activity-feed" id="activityFeed">
          <div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:2rem 1rem;">
            No active agent tasks.
          </div>
        </div>
      </aside>
    </div>
  </main>

  <div id="modelModal" class="modal-overlay">
    <div class="modal-card">
      <div class="modal-title-bar">
        <span>Select Model & Provider</span>
        <button onclick="closeModals()" style="cursor:pointer; color:var(--text-muted);">✕</button>
      </div>
      <div class="modal-body" id="modelListBody"></div>
    </div>
  </div>

  <div id="confirmationModal" class="modal-overlay">
    <div class="modal-card" style="max-width:480px;">
      <div class="modal-title-bar">
        <span style="color:var(--warning);">Confirmation Required</span>
      </div>
      <div class="modal-body">
        <p id="confirmDesc" style="font-size:0.86rem; line-height:1.5; color:#fff;"></p>
        <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1rem;">
          <button class="btn-control" onclick="resolveConfirmation(false)">Deny</button>
          <button class="btn-control" style="background:var(--accent-primary); color:#fff;" onclick="resolveConfirmation(true)">Allow Execution</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let activeMode = 'agent';
    let currentProvider = 'openai';
    let currentModel = 'gpt-4o';
    let currentWorkspace = 'Personal';
    let isVoiceActive = false;
    let pendingConfirmation = null;

    function setMode(mode) {
      activeMode = mode;
      document.getElementById('btnModeAgent').classList.toggle('active', mode === 'agent');
      document.getElementById('btnModeChat').classList.toggle('active', mode === 'chat');
      document.getElementById('composerStatusHint').textContent = mode === 'agent'
        ? 'Mode: Agent (Full Windows Automation)'
        : 'Mode: Chat (Conversational Reasoning Only)';
      fetch('/api/agent/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAgentMode: mode === 'agent' })
      });
    }

    function toggleVoice() {
      isVoiceActive = !isVoiceActive;
      document.getElementById('btnVoiceToggle').classList.toggle('active', isVoiceActive);
      if (isVoiceActive) {
        startSpeechRecognition();
      } else {
        stopSpeechRecognition();
      }
    }

    let recognition = null;
    function startSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Web Speech API is not supported in this environment.');
        return;
      }
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
          document.getElementById('promptInput').value = transcript;
          sendPrompt();
        }
      };
      recognition.start();
    }

    function stopSpeechRecognition() {
      if (recognition) {
        recognition.stop();
        recognition = null;
      }
    }

    async function sendPrompt() {
      const input = document.getElementById('promptInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      document.getElementById('welcomeHeroBox').style.display = 'none';
      const list = document.getElementById('messagesList');

      const userCard = document.createElement('div');
      userCard.className = 'msg-card user';
      userCard.innerHTML = '<div style="font-weight:700; font-size:0.75rem; color:var(--accent-bright);">YOU</div><div style="color:#fff; white-space:pre-wrap;">' + escapeHtml(text) + '</div>';
      list.appendChild(userCard);

      const aiCard = document.createElement('div');
      aiCard.className = 'msg-card assistant';
      aiCard.innerHTML = '<div style="font-weight:700; font-size:0.75rem; color:var(--text-secondary);">OPENWORK (' + currentModel + ')</div><div class="ai-body" style="color:#fff; white-space:pre-wrap;">Executing...</div>';
      list.appendChild(aiCard);
      list.scrollTop = list.scrollHeight;

      const bodyDiv = aiCard.querySelector('.ai-body');

      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, providerId: currentProvider, modelId: currentModel })
      });

      const data = await res.json();
      bodyDiv.textContent = data.response || 'Task completed.';
      list.scrollTop = list.scrollHeight;
      refreshActivityFeed();
    }

    function handleKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
      }
    }

    async function emergencyStop() {
      await fetch('/api/agent/stop', { method: 'POST' });
      refreshActivityFeed();
    }

    async function refreshActivityFeed() {
      const res = await fetch('/api/agent/activity');
      const data = await res.json();
      const feed = document.getElementById('activityFeed');
      const items = data.activityLog || [];
      document.getElementById('activityCounter').textContent = items.length + ' steps';

      if (items.length === 0) {
        feed.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; padding:2rem 1rem;">No active agent tasks.</div>';
        return;
      }

      feed.innerHTML = items.map(s => \`
        <div class="activity-item \${s.status.toLowerCase()}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#FFFFFF;">\${s.toolName}</strong>
            <span class="activity-status-badge status-\${s.status.toLowerCase()}">\${s.status}</span>
          </div>
          <div style="color:var(--text-secondary); font-family:var(--font-mono); font-size:0.72rem;">\${s.description}</div>
          \${s.error ? '<div style="color:var(--danger);">' + s.error + '</div>' : ''}
        </div>
      \`).join('');
      feed.scrollTop = feed.scrollHeight;
    }

    function openModelPicker() {
      document.getElementById('modelModal').classList.add('open');
      loadModels();
    }

    async function loadModels() {
      const res = await fetch('/api/models');
      const data = await res.json();
      const body = document.getElementById('modelListBody');
      body.innerHTML = (data.models || []).map(m => \`
        <div style="padding:0.75rem; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="selectModel('\${m.providerId}', '\${m.id}')">
          <div>
            <div style="font-weight:700;">\${m.name} \${m.recommended ? '<span style="color:var(--accent-bright); font-size:0.7rem;">(Recommended)</span>' : ''}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">Provider: \${m.providerId.toUpperCase()}</div>
          </div>
          <button class="btn-control" style="background:var(--accent-primary); color:#fff;">Select</button>
        </div>
      \`).join('');
    }

    function selectModel(pId, mId) {
      currentProvider = pId;
      currentModel = mId;
      document.getElementById('topbarProvider').textContent = pId.toUpperCase();
      document.getElementById('topbarModel').textContent = mId;
      closeModals();
    }

    function closeModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    setInterval(refreshActivityFeed, 2000);
  </script>
</body>
</html>`;
}