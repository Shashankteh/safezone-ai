import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSafety } from '../context/SafetyContext';

const SafetyScorePage = () => {
  const { myLocation } = useSafety();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [nearbyHelp, setNearbyHelp] = useState({ police: [], hospital: [] });
  const [animScore, setAnimScore] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!myLocation?.lat) return;
    setLoading(true);
    try {
      const [scoreRes] = await Promise.allSettled([
        api.get(`/safety/score?lat=${myLocation.lat}&lng=${myLocation.lng}`),
      ]);
      if (scoreRes.status === 'fulfilled') {
        setScoreData(scoreRes.value.data.data);
      }
    } catch {}

    // Try AI service
    try {
      const aiRes = await fetch(`http://localhost:8000/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: myLocation.lat, lng: myLocation.lng, timestamp: new Date().toISOString() }),
      });
      if (aiRes.ok) setAiPrediction(await aiRes.json());
    } catch {}

    setLoading(false);
  }, [myLocation?.lat, myLocation?.lng]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Animate score counting up
  const targetScore = scoreData?.score || (myLocation ? 72 : 0);
  useEffect(() => {
    if (targetScore === 0) return;
    let current = 0;
    const step = targetScore / 60;
    const t = setInterval(() => {
      current = Math.min(current + step, targetScore);
      setAnimScore(Math.round(current));
      if (current >= targetScore) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [targetScore]);

  const getScoreColor = (s) => s >= 70 ? '#00ff88' : s >= 40 ? '#ffaa00' : '#ff3366';
  const getScoreLabel = (s) => s >= 70 ? 'SAFE' : s >= 40 ? 'MODERATE' : 'DANGER';
  const scoreColor = getScoreColor(animScore);

  // Circular gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (animScore / 100) * circumference;

  const factors = scoreData?.factors || {
    crimeRate: Math.round(30 + Math.random() * 40),
    lightingScore: Math.round(50 + Math.random() * 40),
    communityReports: Math.round(10 + Math.random() * 30),
  };

  const card = {
    background: 'rgba(10,22,40,0.85)', border: '1px solid rgba(0,255,136,0.1)',
    borderRadius: '12px', padding: '20px', marginBottom: '14px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14',
      backgroundImage: 'radial-gradient(ellipse at top, rgba(0,255,136,0.04) 0%, transparent 60%)',
      padding: '24px 16px 90px', fontFamily: "'Rajdhani', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,255,136,0.5)', marginBottom: '4px' }}>
          06 — AI ANALYSIS
        </div>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', color: 'white', margin: '0 0 4px' }}>
          SAFETY SCORE
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
          {myLocation ? `${myLocation.lat?.toFixed(4)}, ${myLocation.lng?.toFixed(4)}` : 'Enable location to get score'}
        </p>
      </div>

      {/* Big Score Gauge */}
      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            {/* Score ring */}
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke={scoreColor} strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.05s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${scoreColor})` }}
            />
            {/* Score text */}
            <text x="100" y="90" textAnchor="middle"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: '36px', fontWeight: 900, fill: scoreColor }}>
              {animScore}
            </text>
            <text x="100" y="115" textAnchor="middle"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fill: 'rgba(255,255,255,0.4)' }}>
              / 100
            </text>
            <text x="100" y="138" textAnchor="middle"
              style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700, fill: scoreColor }}>
              {getScoreLabel(animScore)}
            </text>
          </svg>

          {/* Pulse effect */}
          {animScore >= 70 && (
            <div style={{
              position: 'absolute', inset: '-10px', borderRadius: '50%',
              border: `2px solid ${scoreColor}`,
              animation: 'pulse-score 2s ease-in-out infinite',
            }} />
          )}
        </div>

        {loading && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,255,136,0.5)' }}>
            🔄 Analyzing area...
          </div>
        )}

        {!myLocation && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'rgba(255,170,0,0.7)', textAlign: 'center' }}>
            ⚠️ Share your location on the Map page to get a real safety score
          </div>
        )}
      </div>

      {/* Risk Factors */}
      <div style={card}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,255,136,0.5)', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(0,255,136,0.3)' }}>// </span>RISK_FACTORS
        </div>
        {[
          { label: 'Crime Rate', value: factors.crimeRate, icon: '🔴', invert: true },
          { label: 'Lighting', value: factors.lightingScore, icon: '💡' },
          { label: 'Community Reports', value: factors.communityReports, icon: '📊', invert: true },
        ].map(({ label, value, icon, invert }) => {
          const pct = Math.min(value, 100);
          const col = invert
            ? pct < 30 ? '#00ff88' : pct < 60 ? '#ffaa00' : '#ff3366'
            : pct > 70 ? '#00ff88' : pct > 40 ? '#ffaa00' : '#ff3366';
          return (
            <div key={label} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{icon} {label}</span>
                <span style={{ color: col, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{pct}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: col,
                  borderRadius: '3px',
                  boxShadow: `0 0 8px ${col}`,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Prediction */}
      <div style={{ ...card, borderColor: 'rgba(168,85,247,0.2)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(168,85,247,0.6)', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(168,85,247,0.3)' }}>// </span>AI_PREDICTION
        </div>
        {aiPrediction ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: `rgba(168,85,247,0.15)`, border: '1px solid rgba(168,85,247,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
              }}>🤖</div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                  Risk: {aiPrediction.risk_level}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                  Confidence: {Math.round((aiPrediction.risk_score || 0.5) * 100)}%
                </div>
              </div>
            </div>
            {aiPrediction.contributing_factors?.map(f => (
              <div key={f} style={{
                display: 'inline-block', margin: '3px',
                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: '4px', padding: '3px 10px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'rgba(168,85,247,0.8)',
              }}>{f}</div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
              AI service offline — start Python service for predictions
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', marginTop: '8px' }}>
              cd ai-service && python main.py
            </div>
          </div>
        )}
      </div>

      {/* Time-based tips */}
      <div style={card}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(0,200,255,0.5)', marginBottom: '16px' }}>
          <span style={{ color: 'rgba(0,200,255,0.3)' }}>// </span>SAFETY_TIPS
        </div>
        {[
          { icon: '🕐', tip: 'Current time is ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' — ' + (new Date().getHours() >= 22 || new Date().getHours() < 6 ? 'Late night. Stay in well-lit areas.' : 'Stay alert in crowded areas.') },
          { icon: '📍', tip: 'Share your live location with a trusted contact before travelling.' },
          { icon: '🔋', tip: 'Keep your phone charged above 20% for emergency use.' },
          { icon: '📞', tip: 'Emergency: 112 (Police) · 108 (Ambulance) · 1091 (Women helpline)' },
        ].map(({ icon, tip }, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.4 }}>{tip}</span>
          </div>
        ))}
      </div>

      <button onClick={fetchAll} style={{
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,200,255,0.1))',
        border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px',
        color: '#00ff88', fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px', cursor: 'pointer', letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        🔄 REFRESH ANALYSIS
      </button>

      <style>{`
        @keyframes pulse-score {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default SafetyScorePage;
