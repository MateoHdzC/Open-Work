import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Palette,
  Mic,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Zap,
} from 'lucide-react';
import { ProviderUI } from '../types';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'agent' | 'appearance' | 'voice'>('providers');
  const [providerData, setProviderData] = useState<{
    activeProviderId: string;
    activeModelId: string;
    providers: ProviderUI[];
  }>({
    activeProviderId: 'openai',
    activeModelId: 'gpt-4o',
    providers: [],
  });

  const [selectedProviderId, setSelectedProviderId] = useState<string>('openai');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    status: string;
    message: string;
    modelCount?: number;
  } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [appSettings, setAppSettings] = useState<any>({
    requireConfirmationForDestructive: true,
    theme: 'dark',
    accentColor: '#3b82f6',
    voice: { enabled: true, autoSpeak: false },
  });

  const loadAll = async () => {
    try {
      const pData = await (window as any).openwork.providers.list();
      setProviderData(pData);
      setSelectedProviderId(pData.activeProviderId);

      const active = pData.providers.find((p: any) => p.id === pData.activeProviderId);
      if (active) {
        setBaseUrlInput(active.baseUrl || '');
      }

      const sData = await (window as any).openwork.settings.get();
      setAppSettings(sData);
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectProvider = (pId: string) => {
    setSelectedProviderId(pId);
    setApiKeyInput('');
    setShowKey(false);
    setTestResult(null);
    const p = providerData.providers.find((item) => item.id === pId);
    if (p) {
      setBaseUrlInput(p.baseUrl || '');
      setDiscoveredModels([]);
    }
  };

  const handleToggleRevealKey = async () => {
    if (showKey) {
      setShowKey(false);
      return;
    }
    if (!apiKeyInput && currentProvider?.hasKey) {
      try {
        const revealed = await (window as any).openwork.providers.revealKey(selectedProviderId);
        if (revealed) {
          setApiKeyInput(revealed);
        }
      } catch {}
    }
    setShowKey(true);
  };

  const handleDeleteKey = async () => {
    if (confirm(`Remove stored API key for ${currentProvider?.name}?`)) {
      await (window as any).openwork.providers.deleteKey(selectedProviderId);
      setApiKeyInput('');
      setShowKey(false);
      setTestResult(null);
      await loadAll();
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      if (apiKeyInput.trim()) {
        await (window as any).openwork.providers.save(selectedProviderId, {
          apiKey: apiKeyInput.trim(),
          baseUrl: baseUrlInput.trim() || undefined,
        });
      }
      const res = await (window as any).openwork.providers.testConnection(
        selectedProviderId,
        apiKeyInput.trim() || undefined
      );
      setTestResult(res);
      if (res.connected) {
        const models = await (window as any).openwork.providers.discoverModels(selectedProviderId);
        if (models && models.length > 0) {
          setDiscoveredModels(models);
        }
      }
    } catch (err: any) {
      setTestResult({
        connected: false,
        status: 'error',
        message: err.message || 'Connection test failed',
      });
    }
    setIsTestingConnection(false);
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      if (apiKeyInput.trim()) {
        await (window as any).openwork.providers.save(selectedProviderId, {
          apiKey: apiKeyInput.trim(),
          baseUrl: baseUrlInput.trim() || undefined,
        });
      }
      const models = await (window as any).openwork.providers.discoverModels(selectedProviderId);
      setDiscoveredModels(models || []);
    } catch {}
    setIsDiscovering(false);
  };

  const handleSaveAndActivate = async (modelId?: string) => {
    const targetModel = modelId || providerData.activeModelId;
    await (window as any).openwork.providers.save(selectedProviderId, {
      apiKey: apiKeyInput.trim() || undefined,
      baseUrl: baseUrlInput.trim() || undefined,
      selectedModel: targetModel,
    });
    await (window as any).openwork.providers.setActive(selectedProviderId, targetModel);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    loadAll();
  };

  const handleUpdateSetting = async (patch: any) => {
    const updated = { ...appSettings, ...patch };
    setAppSettings(updated);
    await (window as any).openwork.settings.save(patch);
  };

  const currentProvider = providerData.providers.find((p) => p.id === selectedProviderId);

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Settings & Configuration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
          Connect your personal AI provider API keys, manage autonomy and security, customize preferences.
        </p>

        {/* Setting Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
          {[
            { id: 'providers', label: 'Providers & Keys', icon: Key },
            { id: 'agent', label: 'Agent & Security', icon: Shield },
            { id: 'voice', label: 'Voice Controls', icon: Mic },
            { id: 'appearance', label: 'Appearance', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <Icon size={16} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Providers & Keys */}
        {activeTab === 'providers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Provider Picker */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              padding: '20px',
            }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="var(--accent)" />
                Choose AI Provider
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {providerData.providers.map((p) => {
                  const isSelected = p.id === selectedProviderId;
                  const isActive = p.id === providerData.activeProviderId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProvider(p.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-main)',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: p.hasKey ? 'var(--status-success)' : 'var(--text-muted)', marginTop: '4px' }}>
                        {p.id === 'ollama' ? 'Local' : p.hasKey ? '✓ Key Saved' : 'No Key'}
                      </div>
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent)',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Provider Config Details */}
              {currentProvider && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  {/* API Key */}
                  {selectedProviderId !== 'ollama' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {currentProvider.name} API Key
                        </label>
                        {currentProvider.hasKey && (
                          <button
                            type="button"
                            onClick={handleDeleteKey}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--status-danger)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={12} /> Clear Stored Key
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={showKey ? 'text' : 'password'}
                            placeholder={currentProvider.hasKey ? (currentProvider.maskedKey || '●●●●●●●●●●●●●●●● (Saved securely)') : 'Enter API Key...'}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            style={{ width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px' }}
                          />
                          <button
                            type="button"
                            onClick={handleToggleRevealKey}
                            title={showKey ? 'Hide Key' : 'Reveal Key'}
                            style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Base URL */}
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      API Base Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={baseUrlInput}
                      onChange={(e) => setBaseUrlInput(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    />
                  </div>

                  {/* Connection Test Status Feedback Alert */}
                  {testResult && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: testResult.connected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: testResult.connected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      color: testResult.connected ? 'var(--status-success)' : '#fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      {testResult.connected ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  {/* Discovery / Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Zap size={14} color="var(--accent)" className={isTestingConnection ? 'custom-pulse' : ''} />
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                      </button>

                      <button
                        onClick={handleDiscover}
                        disabled={isDiscovering}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={14} className={isDiscovering ? 'custom-pulse' : ''} />
                        {isDiscovering ? 'Discovering...' : 'Discover Models'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveAndActivate()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--accent)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {saveSuccess ? <CheckCircle2 size={16} /> : null}
                      {saveSuccess ? 'Saved & Activated!' : 'Save & Set as Active'}
                    </button>
                  </div>

                  {/* Discovered Models List */}
                  {discoveredModels.length > 0 && (
                    <div style={{ marginTop: '12px', backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Available Models Dynamically Discovered ({discoveredModels.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                        {discoveredModels.map((m) => {
                          const isSelected = providerData.activeModelId === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => handleSaveAndActivate(m.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-card)',
                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ fontFamily: 'monospace', fontWeight: isSelected ? 600 : 400 }}>
                                {m.name || m.id}
                              </span>
                              {m.capabilities?.vision && (
                                <span title="Vision capable" style={{ fontSize: '10px' }}>👁️</span>
                              )}
                              {m.capabilities?.functionCalling && (
                                <span title="Tool / Function calling" style={{ fontSize: '10px' }}>⚙️</span>
                              )}
                              {m.capabilities?.reasoning && (
                                <span title="Reasoning model" style={{ fontSize: '10px' }}>🧠</span>
                              )}
                              {isSelected && (
                                <span style={{ fontSize: '10px', marginLeft: '2px', fontWeight: 700 }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Agent & Security */}
        {activeTab === 'agent' && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="var(--accent)" />
              Security Firewall & Confirmation Policy
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Require Confirmation for Destructive Actions</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Prevents accidental deletions of files, process terminations, or critical changes without explicit user approval.
                </div>
              </div>
              <input
                type="checkbox"
                checked={appSettings.requireConfirmationForDestructive}
                onChange={(e) => handleUpdateSetting({ requireConfirmationForDestructive: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Empirical Windows Reality Verification</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Always checks OS state (process tree, filesystem, exit codes) rather than blindly trusting model claims.
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--status-success)', fontWeight: 600 }}>Always Active</span>
            </div>
          </div>
        )}

        {/* Tab 3: Voice */}
        {activeTab === 'voice' && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic size={16} color="var(--accent)" />
              Voice & Continuous Duplex Conversation
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Voice Input (Speech Recognition)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Enables microphone dictation and voice commands directly to the Agent Engine.
                </div>
              </div>
              <input
                type="checkbox"
                checked={appSettings.voice?.enabled ?? true}
                onChange={(e) => handleUpdateSetting({ voice: { ...appSettings.voice, enabled: e.target.checked } })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Text-to-Speech Spoken Responses</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Automatically speak model responses via Windows synthesizer.
                </div>
              </div>
              <input
                type="checkbox"
                checked={appSettings.voice?.autoSpeak ?? false}
                onChange={(e) => handleUpdateSetting({ voice: { ...appSettings.voice, autoSpeak: e.target.checked } })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Appearance */}
        {activeTab === 'appearance' && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={16} color="var(--accent)" />
              Appearance & Theme
            </h2>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Accent Color
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      handleUpdateSetting({ accentColor: color });
                      document.documentElement.style.setProperty('--accent', color);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: appSettings.accentColor === color ? '3px solid #ffffff' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
