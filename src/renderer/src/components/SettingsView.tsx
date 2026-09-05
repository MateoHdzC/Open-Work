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
    const p = providerData.providers.find((item) => item.id === pId);
    if (p) {
      setBaseUrlInput(p.baseUrl || '');
      setDiscoveredModels([]);
    }
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      // First save current key if typed
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
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        {currentProvider.name} API Key
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={showKey ? 'text' : 'password'}
                            placeholder={currentProvider.hasKey ? '●●●●●●●●●●●●●●●● (Saved securely)' : 'Enter API Key...'}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            style={{ width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }}
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

                  {/* Discovery / Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
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
                      }}
                    >
                      <RefreshCw size={14} className={isDiscovering ? 'custom-pulse' : ''} />
                      Test Connection & Discover Models
                    </button>

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
                        Available Models Discovered dynamically ({discoveredModels.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                        {discoveredModels.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSaveAndActivate(m.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              backgroundColor: providerData.activeModelId === m.id ? 'var(--accent)' : 'var(--bg-card)',
                              color: providerData.activeModelId === m.id ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {m.name || m.id} {m.capabilities?.vision ? '👁️' : ''}
                          </button>
                        ))}
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
