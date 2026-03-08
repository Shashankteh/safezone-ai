import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Welcome to SafeZone! 🛡️');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Shashank Goyal' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'user@safezone.ai' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 84324 74451' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 chars, A-Z, 0-9' },
  ];

  const inputStyle = {
    width: '100%', background: 'rgba(0,200,255,0.03)',
    border: '1px solid rgba(0,200,255,0.2)', borderRadius: '6px',
    padding: '12px 16px', color: 'white',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050d14',
      backgroundImage: 'linear-gradient(rgba(0,200,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.02) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(10,22,40,0.9)',
        border: '1px solid rgba(0,200,255,0.15)',
        borderRadius: '12px', padding: '40px 32px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(0,200,255,0.05)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)',
            marginBottom: '16px', fontSize: '28px',
            boxShadow: '0 0 20px rgba(0,200,255,0.2)',
          }}>🛡️</div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 700,
            fontSize: '22px', color: 'white', margin: '0 0 4px',
          }}>JOIN SAFEZONE</h1>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0,
          }}>CREATE YOUR SAFETY PROFILE</p>
        </div>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', color: 'rgba(0,200,255,0.5)', marginBottom: '24px',
        }}>
          <span style={{ color: 'rgba(0,200,255,0.3)' }}>// </span>NEW_USER_REGISTRATION
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
              }}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(0,200,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,200,255,0.2)'}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', marginTop: '8px',
              background: 'linear-gradient(135deg, rgba(0,200,255,0.2), rgba(0,255,136,0.1))',
              border: '1px solid rgba(0,200,255,0.5)', borderRadius: '6px',
              color: 'white', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, boxSizing: 'border-box',
            }}
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px', color: 'rgba(255,255,255,0.3)',
        }}>
          Already registered?
          <Link to="/login" style={{ color: '#00ff88', textDecoration: 'none', marginLeft: '6px' }}>
            Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
