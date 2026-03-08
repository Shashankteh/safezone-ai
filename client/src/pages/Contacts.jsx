import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BottomNav from '../components/Layout/BottomNav';
import { AuthContext } from '../context/AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Contacts = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [contacts, setContacts] = useState(user?.trustedContacts || []);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Sync with user context
  useEffect(() => {
    if (user?.trustedContacts) {
      setContacts(user.trustedContacts);
    }
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const updated = [...contacts, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      }];

      const res = await axios.put(
        `${API}/auth/trusted-contacts`,
        { contacts: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newContacts = res.data?.data?.trustedContacts || updated;
      setContacts(newContacts);
      if (updateUser) updateUser({ trustedContacts: newContacts });
      setForm({ name: '', phone: '', email: '' });
      toast.success(`✅ ${form.name} added as trusted contact!`);
    } catch (err) {
      console.error('Add contact error:', err);
      toast.error(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    setDeleting(index);
    try {
      const token = localStorage.getItem('accessToken');
      const updated = contacts.filter((_, i) => i !== index);

      await axios.put(
        `${API}/auth/trusted-contacts`,
        { contacts: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setContacts(updated);
      if (updateUser) updateUser({ trustedContacts: updated });
      toast.success('Contact removed');
    } catch (err) {
      toast.error('Failed to remove contact');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14', paddingBottom: 90,
      backgroundImage: 'linear-gradient(rgba(0,255,136,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.02) 1px,transparent 1px)',
      backgroundSize: '50px 50px'
    }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 3, marginBottom: 4 }}>
          03 — NETWORK
        </div>
        <h1 style={{ margin: 0, color: 'white', fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
          TRUSTED CONTACTS
        </h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
          People who get notified when you trigger SOS
        </p>
      </div>

      {/* Add Contact Form */}
      <div style={{ margin: '16px 16px 0' }}>
        <div style={{
          background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.15)',
          borderRadius: 8, padding: 16
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 2, marginBottom: 14 }}>
            // ADD_CONTACT
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name *"
              style={inputStyle}
            />
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXXXXXXXX *"
              type="tel"
              style={inputStyle}
            />
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email (optional)"
              type="email"
              style={inputStyle}
            />

            <button
              onClick={handleAdd}
              disabled={loading}
              style={{
                padding: '13px', fontFamily: 'monospace', fontSize: 13,
                fontWeight: 700, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(0,255,136,0.05)' : 'rgba(0,255,136,0.12)',
                border: '1px solid rgba(0,255,136,0.4)', color: '#00ff88',
                borderRadius: 4, transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
                boxShadow: loading ? 'none' : '0 0 15px rgba(0,255,136,0.15)'
              }}
            >
              {loading ? '⏳ ADDING...' : '+ ADD CONTACT'}
            </button>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ margin: '16px 16px 0' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 2, marginBottom: 12 }}>
          // CONTACTS ({contacts.length}/5)
        </div>

        {contacts.length === 0 ? (
          <div style={{
            background: 'rgba(10,22,40,0.6)', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '32px 16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 12, margin: 0 }}>
              No trusted contacts yet
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 6 }}>
              Add people who should be notified in an emergency
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contacts.map((contact, i) => (
              <div key={i} style={{
                background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.1)',
                borderRadius: 8, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'monospace', fontSize: 16, color: '#00ff88', fontWeight: 700
                  }}>
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                      {contact.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11 }}>
                      📱 {contact.phone}
                    </div>
                    {contact.email && (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
                        ✉️ {contact.email}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(i)}
                  disabled={deleting === i}
                  style={{
                    background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)',
                    color: '#ff3366', width: 32, height: 32, borderRadius: 4,
                    cursor: 'pointer', fontSize: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {deleting === i ? '⏳' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{ margin: '16px', padding: '12px 16px', background: 'rgba(0,200,255,0.05)', border: '1px solid rgba(0,200,255,0.15)', borderRadius: 6 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
          🛡️ When you trigger SOS, all trusted contacts will receive an SMS with your live location.
          <br />⚠️ Make sure phone numbers are in international format: <span style={{ color: '#00c8ff' }}>+91XXXXXXXXXX</span>
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px 14px', fontFamily: 'monospace', fontSize: 13,
  background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.2)',
  color: 'white', borderRadius: 4, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

export default Contacts;
