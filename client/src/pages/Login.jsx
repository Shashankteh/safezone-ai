import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🛡️');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050d14',
      backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(10,22,40,0.9)',
        border: '1px solid rgba(0,255,136,0.15)',
        borderRadius: '12px', padding: '40px 32px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(0,255,136,0.05)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
            marginBottom: '16px', fontSize: '28px',
            boxShadow: '0 0 20px rgba(0,255,136,0.2)',
          }}>🛡️</div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontWeight: 700,
            fontSize: '22px', color: 'white', margin: '0 0 4px',
          }}>SAFEZONE AI</h1>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0,
          }}>SMART PERSONAL SAFETY</p>
        </div>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', color: 'rgba(0,255,136,0.5)', marginBottom: '24px',
        }}>
          <span style={{ color: 'rgba(0,255,136,0.3)' }}>// </span>USER_LOGIN
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
            }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@safezone.ai"
              required
              style={{
                width: '100%', background: 'rgba(0,255,136,0.03)',
                border: '1px solid rgba(0,255,136,0.2)', borderRadius: '6px',
                padding: '12px 16px', color: 'white',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', background: 'rgba(0,255,136,0.03)',
                  border: '1px solid rgba(0,255,136,0.2)', borderRadius: '6px',
                  padding: '12px 44px 12px 16px', color: 'white',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,255,136,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,255,136,0.2)'}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: '16px',
              }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,255,0.1))',
              border: '1px solid rgba(0,255,136,0.5)', borderRadius: '6px',
              color: 'white', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, boxSizing: 'border-box',
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN →'}
          </button>
        </form>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px', color: 'rgba(255,255,255,0.3)',
        }}>
          No account?
          <Link to="/register" style={{ color: '#00ff88', textDecoration: 'none', marginLeft: '6px' }}>
            Register →
          </Link>
        </div>

        <div style={{
          textAlign: 'center', marginTop: '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', color: 'rgba(255,255,255,0.1)',
        }}>
          SafeZone AI · Shashank Goyal · 2025
        </div>
      </div>
    </div>
  );
};

export default Login;
