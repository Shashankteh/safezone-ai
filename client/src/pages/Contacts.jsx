import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const Contacts = () => {
  const { } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/safety/contacts`, { headers });
      setContacts(res.data?.data?.contacts || []);
    } catch {
      // No contacts yet
    } finally { setLoading(false); }
  };

  const addContact = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await axios.post(`${API}/safety/contacts`, form, { headers });
      toast.success('Contact added! ✅');
      setForm({ name: '', phone: '', email: '' });
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add contact');
    } finally { setAdding(false); }
  };

  const removeContact = async (id) => {
    try {
      await axios.delete(`${API}/safety/contacts/${id}`, { headers });
      toast.success('Contact removed');
      fetchContacts();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const cardStyle = {
    background: 'rgba(10,22,40,0.9)', border: '1px solid rgba(0,255,136,0.1)',
    borderRadius: '10px', padding: '20px', marginBottom: '12px',
  };

  const inputStyle = {
    width: '100%', background: 'rgba(0,255,136,0.03)',
    border: '1px solid rgba(0,255,136,0.2)', borderRadius: '6px',
    padding: '10px 14px', color: 'white',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
    outline: 'none', boxSizing: 'border-box', marginBottom: '10px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      padding: '20px 16px 80px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,255,136,0.5)', marginBottom: '4px' }}>
          03 — NETWORK
        </div>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', color: 'white', margin: 0 }}>
          TRUSTED CONTACTS
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>
          People who get notified when you trigger SOS
        </p>
      </div>

      {/* Add Contact Form */}
      <div style={cardStyle}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,255,136,0.5)', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(0,255,136,0.3)' }}>// </span>ADD_CONTACT
        </div>
        <form onSubmit={addContact}>
          <input
            style={inputStyle} placeholder="Full Name *" value={form.name} required
            onChange={e => setForm({ ...form, name: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'}
          />
          <input
            style={inputStyle} placeholder="Phone Number * (+91...)" value={form.phone} required
            onChange={e => setForm({ ...form, phone: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'}
          />
          <input
            style={inputStyle} placeholder="Email (optional)" value={form.email} type="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'}
          />
          <button type="submit" disabled={adding} style={{
            width: '100%', padding: '12px',
            background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,255,0.1))',
            border: '1px solid rgba(0,255,136,0.4)', borderRadius: '6px',
            color: 'white', fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
            cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.6 : 1,
            letterSpacing: '0.05em',
          }}>
            {adding ? 'ADDING...' : '+ ADD CONTACT'}
          </button>
        </form>
      </div>

      {/* Contacts List */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
        {contacts.length} CONTACT{contacts.length !== 1 ? 'S' : ''} REGISTERED
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'rgba(0,255,136,0.5)', padding: '40px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
          Loading...
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
            No trusted contacts yet.<br />Add someone above.
          </p>
        </div>
      ) : contacts.map((c, i) => (
        <div key={c._id || i} style={{
          ...cardStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>👤</div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>{c.name}</div>
              <div style={{ color: 'rgba(0,255,136,0.6)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{c.phone}</div>
              {c.email && <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{c.email}</div>}
            </div>
          </div>
          <button onClick={() => removeContact(c._id)} style={{
            background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)',
            borderRadius: '6px', color: '#ff3366', padding: '8px 14px',
            cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
          }}>
            REMOVE
          </button>
        </div>
      ))}
    </div>
  );
};

export default Contacts;
    