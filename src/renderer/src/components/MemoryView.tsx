import React, { useState, useEffect } from 'react';
import { BrainCircuit, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { MemoryItemUI } from '../types';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItemUI[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [topicKey, setTopicKey] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'permanent' | 'project' | 'conversation' | 'working'>('permanent');
  const [isAdding, setIsAdding] = useState(false);

  const fetchMemories = async () => {
    try {
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const res = await (window as any).openwork.memory.list(cat);
      setMemories(res || []);
    } catch {}
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedCategory]);

  const handleAdd = async () => {
    if (!topicKey.trim() || !content.trim()) return;
    await (window as any).openwork.memory.save({
      category,
      topicKey: topicKey.trim(),
      content: content.trim(),
    });
    setTopicKey('');
    setContent('');
    setIsAdding(false);
    fetchMemories();
  };

  const handleDelete = async (id: string) => {
    await (window as any).openwork.memory.delete(id);
    fetchMemories();
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all memories in this view?')) {
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      await (window as any).openwork.memory.clear(cat);
      fetchMemories();
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={22} color="var(--accent)" />
              Memory Bank
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Persistent cross-session intelligence (Permanent preferences, project architecture rules, and task state).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsAdding(!isAdding)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              Add Memory
            </button>
            <button
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-danger)',
                fontSize: '13px',
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'permanent', label: 'Permanent' },
            { id: 'project', label: 'Project' },
            { id: 'conversation', label: 'Conversation' },
            { id: 'working', label: 'Working' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: selectedCategory === tab.id ? 600 : 400,
                backgroundColor: selectedCategory === tab.id ? 'var(--bg-card-hover)' : 'transparent',
                color: selectedCategory === tab.id ? '#ffffff' : 'var(--text-muted)',
                border: selectedCategory === tab.id ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Memory Form */}
        {isAdding && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Store New Memory Entry</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                >
                  <option value="permanent">Permanent (Global preferences)</option>
                  <option value="project">Project (Architecture & conventions)</option>
                  <option value="conversation">Conversation</option>
                  <option value="working">Working State</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Topic Key (e.g. stack/primary_lang)</label>
                <input
                  type="text"
                  placeholder="topic_key"
                  value={topicKey}
                  onChange={(e) => setTopicKey(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Content</label>
              <textarea
                placeholder="Content to remember..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsAdding(false)}
                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* List of Memories */}
        {memories.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            No memories stored. You can speak naturally (e.g. "Recuerda que uso TypeScript") or add manual entries here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {memories.map((m) => (
              <div
                key={m.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--accent)',
                      fontWeight: 600,
                    }}>
                      {m.category}
                    </span>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.topicKey}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(m.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '20px' }}>
                    {m.content}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(m.id)}
                  title="Delete memory"
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    marginLeft: '12px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
