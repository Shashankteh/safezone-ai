import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const TrustNetwork = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: 'family', notifyOnSOS: true, notifyOnGeofence: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const contacts = user?.trustedContacts || [];

  const addContact = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put('/api/auth/update-profile', {
        trustedContacts: [...contacts, form]
      });
      updateUser?.(data.data.user);
      setForm({ name: '', phone: '', email: '', relationship: 'family', notifyOnSOS: true, notifyOnGeofence: false });
      setShowAdd(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const removeContact = async (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    try {
      const { data } = await api.put('/api/auth/update-profile', { trustedContacts: updated });
      updateUser?.(data.data.user);
    } catch {}
  };

  const relationshipEmoji = { family: '👨‍👩‍👧', friend: '👫', colleague: '👔', other: '👤' };

  return (
    <div className="trust-network">
      <div className="tn-header">
        <div>
          <h3>🤝 Trust Network</h3>
          <p>{contacts.length}/5 contacts added</p>
        </div>
        {contacts.length < 5 && (
          <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
        )}
      </div>

      {showAdd && (
        <div className="add-form">
          <div className="form-row">
            <input placeholder="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input placeholder="+91 Phone *" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <input placeholder="Email (optional)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

          <div className="rel-row">
            {['family', 'friend', 'colleague', 'other'].map(r => (
              <button
                key={r}
                className={`rel-btn ${form.relationship === r ? 'active' : ''}`}
                onClick={() => setForm(p => ({ ...p, relationship: r }))}
              >
                {relationshipEmoji[r]} {r}
              </button>
            ))}
          </div>

          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={form.notifyOnSOS} onChange={e => setForm(p => ({ ...p, notifyOnSOS: e.target.checked }))} />
              Notify on SOS
            </label>
            <label>
              <input type="checkbox" checked={form.notifyOnGeofence} onChange={e => setForm(p => ({ ...p, notifyOnGeofence: e.target.checked }))} />
              Notify on geofence breach
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="save-btn" onClick={addContact} disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </div>
      )}

      <div className="contacts-list">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <p>No trusted contacts yet</p>
            <small>Add people who'll be notified in an emergency</small>
          </div>
        ) : (
          contacts.map((c, i) => (
            <div key={i} className="contact-card">
              <div className="contact-avatar">{relationshipEmoji[c.relationship] || '👤'}</div>
              <div className="contact-info">
                <strong>{c.name}</strong>
                <span>{c.phone}</span>
                {c.email && <span className="email">{c.email}</span>}
                <div className="notify-tags">
                  {c.notifyOnSOS && <span className="tag sos">SOS ✓</span>}
                  {c.notifyOnGeofence && <span className="tag geo">Geofence ✓</span>}
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeContact(i)}>✕</button>
            </div>
          ))
        )}
      </div>

      <style>{`
        .trust-network { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 16px; padding: 16px; }
        .tn-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .tn-header h3 { margin: 0 0 2px; color: #e2e8f0; font-size: 14px; }
        .tn-header p { margin: 0; color: #64748b; font-size: 11px; }
        .add-btn { background: #7c3aed; border: none; border-radius: 8px; color: white; padding: 6px 12px; cursor: pointer; font-size: 12px; }
        .add-form { background: #0f0f1a; border-radius: 10px; padding: 12px; margin-bottom: 12px; border: 1px solid #2d2d3e; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
        .add-form input {
          width: 100%; padding: 8px; background: #1e1e2e; border: 1px solid #2d2d3e;
          border-radius: 6px; color: #e2e8f0; font-size: 12px; box-sizing: border-box; margin-bottom: 6px;
        }
        .rel-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .rel-btn { padding: 4px 8px; border: 1px solid #2d2d3e; border-radius: 12px; background: #1e1e2e; color: #94a3b8; font-size: 11px; cursor: pointer; text-transform: capitalize; }
        .rel-btn.active { background: rgba(124,58,237,0.3); border-color: #7c3aed; color: #c4b5fd; }
        .toggle-row { display: flex; gap: 16px; margin-bottom: 8px; }
        .toggle-row label { display: flex; align-items: center; gap: 6px; color: #94a3b8; font-size: 12px; cursor: pointer; }
        .toggle-row input { accent-color: #7c3aed; }
        .form-error { color: #f87171; font-size: 11px; margin: 0 0 6px; }
        .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .cancel-btn { background: none; border: 1px solid #2d2d3e; border-radius: 6px; color: #94a3b8; padding: 6px 12px; cursor: pointer; font-size: 12px; }
        .save-btn { background: #7c3aed; border: none; border-radius: 6px; color: white; padding: 6px 12px; cursor: pointer; font-size: 12px; }
        .save-btn:disabled { opacity: 0.5; }
        .contacts-list { display: flex; flex-direction: column; gap: 8px; }
        .empty-state { text-align: center; padding: 24px; }
        .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
        .empty-state p { color: #e2e8f0; margin: 0 0 4px; font-size: 13px; }
        .empty-state small { color: #64748b; font-size: 11px; }
        .contact-card { display: flex; align-items: flex-start; gap: 10px; background: #0f0f1a; border-radius: 10px; padding: 10px; border: 1px solid #2d2d3e; }
        .contact-avatar { font-size: 24px; flex-shrink: 0; }
        .contact-info { flex: 1; min-width: 0; }
        .contact-info strong { color: #e2e8f0; font-size: 13px; display: block; }
        .contact-info span { color: #94a3b8; font-size: 11px; display: block; }
        .contact-info .email { color: #64748b; font-size: 10px; }
        .notify-tags { display: flex; gap: 4px; margin-top: 4px; }
        .tag { padding: 2px 6px; border-radius: 10px; font-size: 10px; }
        .tag.sos { background: rgba(239,68,68,0.2); color: #f87171; }
        .tag.geo { background: rgba(124,58,237,0.2); color: #c4b5fd; }
        .remove-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; padding: 4px; border-radius: 4px; flex-shrink: 0; }
        .remove-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
      `}</style>
    </div>
  );
};

export default TrustNetwork;
