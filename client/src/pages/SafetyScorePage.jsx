import React, { useState, useEffect, useCallback } from 'react';
import { useSafety } from '../context/SafetyContext';
import BottomNav from '../components/Layout/BottomNav';

// ── Use env variable for AI service URL ──────────────────────────────────────
const AI_URL = process.env.REACT_APP_AI_URL
  || process.env.REACT_APP_API_URL?.replace('/api', '').replace(':5000', ':8000')
  || 'https://safezone-ai-service-btg9.onrender.com';

const SafetyScorePage = () => {
  const { myLocation } = useSafety();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSafetyData = useCallback(async () => {
    if (!myLocation?.lat) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Try AI prediction
      const aiRes = await fetch(`${AI_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: myLocation.lat,
          lng: myLocation.lng,
          timestamp: new Date().toISOString(),
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setAiPrediction(aiData);

        // Derive score from AI probabilities
        const score = Math.round((1 - aiData.risk_score) * 100);
        const factors = [
          { name: 'Crime Rate', value: Math.round(aiData.probabilities?.High * 100 || 30), icon: '🔴', invert: true },
          { name: 'Lighting', value: aiData.risk_label === 'Low' ? 84 : aiData.risk_label === 'Medium' ? 55 : 25, icon: '💡', invert: false },
          { name: 'Community Reports', value: Math.round(aiData.probabilities?.Low * 40 || 28), icon: '📊', invert: false },
          { name: 'Time of Day', value: new Date().getHours() >= 20 || new Date().getHours() <= 6 ? 30 : 80, icon: '🕐', invert: false },
        ];

        setScoreData({ score, factors, label: aiData.risk_label, advice: aiData.advice || [] });
      } else {
        throw new Error('AI service returned error');
      }
    } catch (err) {
      console.warn('AI service unavailable, using fallback:', err.message);

      // Fallback: calculate simple score from time of day + location
      const hour = new Date().getHours();
      const isNight = hour >= 22 || hour <= 5;
      const isEvening = hour >= 20;
      const baseScore = isNight ? 42 : isEvening ? 62 : 78;

      setScoreData({
        score: baseScore,
        label: baseScore >= 70 ? 'Low' : baseScore >= 50 ? 'Medium' : 'High',
        factors: [
          { name: 'Crime Rate', value: isNight ? 65 : 35, icon: '🔴', invert: true },
          { name: 'Lighting', value: isNight ? 20 : 85, icon: '💡', invert: false },
          { name: 'Community Reports', value: 28, icon: '📊', invert: false },
          { name: 'Time of Day', value: isNight ? 25 : isEvening ? 55 : 85, icon: '🕐', invert: false },
        ],
        advice: isNight
          ? ['Stay in well-lit areas', 'Share your location with trusted contacts', 'Trust your instincts']
          : ['Area appears safe', 'Stay aware of surroundings', 'Share location with contacts'],
      });
      setAiPrediction(null);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [myLocation]);

  useEffect(() => {
    fetchSafetyData();
  }, [fetchSafetyData]);

  // Auto-refresh every 5 min
  useEffect(() => {
    const interval = setInterval(fetchSafetyData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSafetyData]);

  const scoreColor = scoreData
    ? scoreData.score >= 70 ? '#00ff88' : scoreData.score >= 50 ? '#ffaa00' : '#ff3366'
    : '#ffaa00';

  const riskBg = {
    Low: 'rgba(0,255,136,0.1)',
    Medium: 'rgba(255,170,0,0.1)',
    High: 'rgba(255,51,102,0.1)',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050d14', paddingBottom: 80,
      backgroundImage: 'linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)',
      backgroundSize: '50px 50px'
    }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 3, marginBottom: 4 }}>
          // SAFETY_ANALYSIS
        </div>
        <h1 style={{ margin: 0, color: 'white', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
          Safety Score
        </h1>
        {myLocation && (
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            📍 {myLocation.lat?.toFixed(4)}, {myLocation.lng?.toFixed(4)}
          </div>
        )}
      </div>

      {/* No location warning */}
      {!myLocation && (
        <div style={{
          margin: '16px', padding: '16px',
          background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.3)',
          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ color: '#ffaa00', fontWeight: 600, fontSize: 13 }}>Location Required</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>
              Go to Map page and click "Share Location" to get your safety score
            </div>
          </div>
        </div>
      )}

      {/* Score Circle */}
      {(scoreData || loading) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px' }}>
          <div style={{ position: 'relative', width: 180, height: 180 }}>
            {/* SVG ring */}
            <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              {scoreData && (
                <circle
                  cx="90" cy="90" r="75" fill="none"
                  stroke={scoreColor} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - scoreData.score / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${scoreColor})` }}
                />
              )}
            </svg>

            {/* Center content */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'monospace' }}>
                  SCANNING...
                </div>
              ) : scoreData ? (
                <>
                  <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor, lineHeight: 1, fontFamily: 'monospace' }}>
                    {scoreData.score}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginTop: 2 }}>
                    / 100
                  </div>
                  <div style={{
                    marginTop: 8, fontSize: 11, fontFamily: 'monospace',
                    padding: '3px 10px', borderRadius: 2,
                    background: riskBg[scoreData.label] || 'rgba(255,255,255,0.05)',
                    color: scoreColor, border: `1px solid ${scoreColor}40`
                  }}>
                    {scoreData.label?.toUpperCase()} RISK
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* AI Badge */}
      {aiPrediction && (
        <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 10, padding: '3px 12px',
            background: 'rgba(0,200,255,0.1)', border: '1px solid rgba(0,200,255,0.3)',
            color: '#00c8ff', borderRadius: 2
          }}>
            🤖 AI POWERED · {Math.round(aiPrediction.confidence * 100)}% confidence
          </span>
        </div>
      )}

      {/* Risk Factors */}
      {scoreData && (
        <div style={{ margin: '16px 16px 0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 2, marginBottom: 12 }}>
            // RISK_FACTORS
          </div>
          <div style={{
            background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(0,255,136,0.08)',
            borderRadius: 8, overflow: 'hidden'
          }}>
            {scoreData.factors.map((factor, i) => {
              const barVal = factor.invert ? (100 - factor.value) : factor.value;
              const barColor = barVal >= 70 ? '#00ff88' : barVal >= 50 ? '#ffaa00' : '#ff3366';
              return (
                <div key={i} style={{
                  padding: '14px 16px',
                  borderBottom: i < scoreData.factors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {factor.icon} {factor.name}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: barColor }}>
                      {factor.value}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${factor.value}%`, borderRadius: 2,
                      background: barColor, transition: 'width 1s ease',
                      boxShadow: `0 0 8px ${barColor}60`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Prediction Detail */}
      {aiPrediction && (
        <div style={{ margin: '16px 16px 0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 2, marginBottom: 12 }}>
            // AI_PREDICTION
          </div>
          <div style={{
            background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(0,200,255,0.15)',
            borderRadius: 8, padding: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              {['Low', 'Medium', 'High'].map(level => (
                <div key={level} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 18, fontWeight: 900, fontFamily: 'monospace',
                    color: level === 'Low' ? '#00ff88' : level === 'Medium' ? '#ffaa00' : '#ff3366'
                  }}>
                    {Math.round((aiPrediction.probabilities?.[level] || 0) * 100)}%
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {level.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Tips */}
      {scoreData?.advice?.length > 0 && (
        <div style={{ margin: '16px 16px 0' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,255,136,0.5)', letterSpacing: 2, marginBottom: 12 }}>
            // SAFETY_TIPS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scoreData.advice.slice(0, 4).map((tip, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(0,255,136,0.08)',
                borderRadius: 6, padding: '10px 14px'
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {i === 0 ? '🕐' : i === 1 ? '📤' : i === 2 ? '⚡' : '🛡️'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      {myLocation && (
        <div style={{ margin: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button onClick={fetchSafetyData} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 32px', fontFamily: 'monospace', fontSize: 12,
            background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)',
            color: '#00ff88', cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: 4, transition: 'all 0.2s', opacity: loading ? 0.6 : 1
          }}>
            {loading ? '⏳ SCANNING...' : '🔄 REFRESH SCORE'}
          </button>
          {lastUpdated && (
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default SafetyScorePage;
