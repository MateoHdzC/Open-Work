import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { ActivityStepUI } from '../types';

interface ActivityViewProps {
  activityLog: ActivityStepUI[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ activityLog }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = activityLog.filter((item) => {
    const matchesSearch =
      item.toolName.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(item.parameters || {}).toLowerCase().includes(search.toLowerCase()) ||
      (item.verificationReality || '').toLowerCase().includes(search.toLowerCase());

    if (filterCategory === 'all') return matchesSearch;
    if (filterCategory === 'errors') return matchesSearch && item.status === 'Failed';
    if (filterCategory === 'verified') return matchesSearch && item.verified;
    return matchesSearch;
  });

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={22} color="var(--accent)" />
              Live Activity Ledger
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Chronological log of all real actions, system calls, outputs, and empirical Windows verifications.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search tools or reality..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', fontSize: '12px' }}
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Events</option>
              <option value="verified">Verified Only</option>
              <option value="errors">Failures Only</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            No activity logged yet. Direct OpenWork in Agent mode to execute actions on Windows.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.slice().reverse().map((step) => (
              <div
                key={step.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent)' }}>
                      {step.toolName}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(step.startedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    {step.status === 'Completed' && (
                      <span style={{ color: 'var(--status-success)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                    {step.status === 'Failed' && (
                      <span style={{ color: 'var(--status-danger)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={13} /> Failed
                      </span>
                    )}
                    {step.status === 'Running' && (
                      <span style={{ color: 'var(--status-running)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} className="custom-pulse" /> Running
                      </span>
                    )}
                    {step.status === 'Waiting' && (
                      <span style={{ color: 'var(--status-waiting)', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={13} /> Waiting
                      </span>
                    )}
                  </div>
                </div>

                {/* Parameters */}
                {step.parameters && Object.keys(step.parameters).length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--bg-main)',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                    overflowX: 'auto',
                    marginBottom: '8px',
                  }}>
                    {JSON.stringify(step.parameters)}
                  </div>
                )}

                {/* Empirical Verification Reality Tag */}
                {step.verificationReality && (
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    backgroundColor: step.verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${step.verified ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: step.verified ? 'var(--status-success)' : 'var(--status-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    🛡️ {step.verificationReality}
                  </div>
                )}

                {/* Result summary or error */}
                {step.error && (
                  <div style={{ marginTop: '6px', color: 'var(--status-danger)', fontSize: '11px', fontFamily: 'monospace' }}>
                    Error: {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
