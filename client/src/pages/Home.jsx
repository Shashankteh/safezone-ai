import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const features = [
    { icon: '📍', title: 'Live Location Sharing', desc: 'Share real-time location with trusted contacts securely' },
    { icon: '🆘', title: 'One-Tap SOS', desc: 'Instant alerts via SMS + push to all your trusted contacts' },
    { icon: '🤖', title: 'AI Risk Prediction', desc: 'ML-powered safety scores for any area, 24/7' },
    { icon: '📞', title: 'Fake Call', desc: 'Escape unsafe situations with a convincing fake incoming call' },
    { icon: '🗺️', title: 'Safe Zones', desc: 'Create geofence alerts for home, office, and danger zones' },
    { icon: '☠️', title: "Dead Man's Switch", desc: 'Auto SOS if you miss a check-in — no action needed' }
  ];

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🛡️ SafeZone AI v2.0</div>
        <h1>
          Your Personal Safety,<br />
          <span className="gradient-text">Powered by AI</span>
        </h1>
        <p>
          Real-time tracking · AI risk prediction · Instant SOS alerts<br />
          Built for Jaipur, made for everywhere.
        </p>
        <div className="hero-actions">
          {user ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Open Dashboard →
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Get Started Free
              </button>
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                Login
              </button>
            </>
          )}
        </div>

        {/* Animated rings */}
        <div className="hero-rings">
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="ring r3" />
          <div className="shield-center">🛡️</div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>Everything You Need to Stay Safe</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stat">
          <div className="stat-val">96.7%</div>
          <div className="stat-key">AI Accuracy</div>
        </div>
        <div className="stat">
          <div className="stat-val">&lt;2s</div>
          <div className="stat-key">SOS Delivery</div>
        </div>
        <div className="stat">
          <div className="stat-val">AES-256</div>
          <div className="stat-key">Encryption</div>
        </div>
        <div className="stat">
          <div className="stat-val">24/7</div>
          <div className="stat-key">Monitoring</div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="tech-section">
        <h2>Production-Grade Stack</h2>
        <div className="tech-tags">
          {['React 18', 'Node.js', 'Python FastAPI', 'MongoDB', 'Socket.io', 'Twilio SMS', 'Firebase FCM', 'Docker', 'GitHub Actions', 'Random Forest ML'].map(t => (
            <span key={t} className="tech-tag">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="cta">
          <h2>Stay Safe. Start Free.</h2>
          <button className="btn-primary large" onClick={() => navigate('/register')}>
            Create Your Account
          </button>
        </section>
      )}

      <style>{`
        .home-page { background: #0f0f1a; min-height: 100vh; color: #e2e8f0; }
        .hero { text-align: center; padding: 80px 20px 60px; position: relative; overflow: hidden; }
        .hero-badge { display: inline-block; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4); border-radius: 20px; padding: 6px 16px; font-size: 12px; color: #c4b5fd; margin-bottom: 20px; }
        .hero h1 { font-size: clamp(32px, 6vw, 56px); font-weight: 900; margin: 0 0 16px; line-height: 1.1; }
        .gradient-text { background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero p { color: #94a3b8; font-size: 16px; line-height: 1.7; margin-bottom: 32px; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 48px; flex-wrap: wrap; }
        .btn-primary { background: linear-gradient(135deg, #7c3aed, #a855f7); border: none; border-radius: 12px; color: white; padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer; }
        .btn-primary.large { padding: 16px 40px; font-size: 17px; }
        .btn-secondary { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 12px; color: #e2e8f0; padding: 14px 28px; font-size: 15px; cursor: pointer; }
        .hero-rings { position: relative; width: 180px; height: 180px; margin: 0 auto; }
        .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(124,58,237,0.3); animation: spin 12s linear infinite; }
        .r1 { inset: 0; animation-duration: 12s; }
        .r2 { inset: 20px; animation-duration: 8s; animation-direction: reverse; }
        .r3 { inset: 40px; animation-duration: 5s; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .shield-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 56px; }
        .features { padding: 60px 20px; max-width: 1100px; margin: 0 auto; }
        .features h2 { text-align: center; font-size: 28px; margin: 0 0 40px; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .feature-card { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 16px; padding: 24px; transition: border-color 0.2s; }
        .feature-card:hover { border-color: #7c3aed; }
        .feature-icon { font-size: 36px; margin-bottom: 12px; }
        .feature-card h3 { margin: 0 0 8px; font-size: 16px; color: #e2e8f0; }
        .feature-card p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.6; }
        .stats-section { display: flex; justify-content: center; gap: 40px; padding: 40px 20px; background: #1e1e2e; flex-wrap: wrap; }
        .stat { text-align: center; }
        .stat-val { font-size: 36px; font-weight: 900; background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-key { color: #64748b; font-size: 12px; margin-top: 4px; }
        .tech-section { padding: 60px 20px; text-align: center; max-width: 900px; margin: 0 auto; }
        .tech-section h2 { font-size: 24px; margin: 0 0 24px; }
        .tech-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .tech-tag { background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: #94a3b8; }
        .cta { text-align: center; padding: 60px 20px; }
        .cta h2 { font-size: 32px; margin: 0 0 24px; }
      `}</style>
    </div>
  );
};

export default Home;
