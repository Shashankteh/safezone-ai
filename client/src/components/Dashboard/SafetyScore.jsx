import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const SafetyScore = ({ location }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nearbyHelp, setNearbyHelp] = useState({ police: [], hospital: [] });

  const fetchScore = useCallback(async () => {
    if (!location?.lat || !location?.lng) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/safety/score?lat=${location.lat}&lng=${location.lng}`);
      setScoreData(data.data);
    } catch (err) {
      console.error('Safety score error:', err);
    } finally {
      setLoading(false);
    }
  }, [location?.lat, location?.lng]);

  const fetchNearbyHelp = useCallback(async () => {
    if (!location?.lat || !location?.lng) return;
    try {
      const [policeRes, hospitalRes] = await Promise.allSettled([
        api.get(`/api/safety/nearby-help?lat=${location.lat}&lng=${location.lng}&type=police`),
        api.get(`/api/safety/nearby-help?lat=${location.lat}&lng=${location.lng}&type=hospital`)
      ]);

      setNearbyHelp({
        police: policeRes.status === 'fulfilled' ? policeRes.value.data.data?.slice(0, 2) || [] : [],
        hospital: hospitalRes.status === 'fulfilled' ? hospitalRes.value.data.data?.slice(0, 2) || [] : []
      });
    } catch {}
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    fetchScore();
    fetchNearbyHelp();
  }, [fetchScore, fetchNearbyHelp]);

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskEmoji = (level) => ({ Low: '✅', Medium: '⚠️', High: '🚨' }[level] || '❓');

  const score = scoreData?.score || 0;
  const riskLevel = scoreData?.riskLevel || 'Unknown';
  const scoreColor = getScoreColor(score);

  // SVG circle progress
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="safety-score-widget">
      {/* Score ring */}
      <div className="score-ring-container">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="#1e1e2e" strokeWidth="8" />
          <circle
            cx="45" cy="45" r={radius}
            fill="none" stroke={scoreColor} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="score-center">
          {loading ? (
            <span className="score-loading">...</span>
          ) : (
            <>
              <span className="score-number" style={{ color: scoreColor }}>{score}</span>
              <span className="score-label">/ 100</span>
            </>
          )}
        </div>
      </div>

      {/* Risk level */}
      <div className="risk-badge" style={{ borderColor: scoreColor }}>
        {getRiskEmoji(riskLevel)} {riskLevel} Risk
      </div>

      {/* Stats */}
      {scoreData && (
        <div className="score-stats">
          <div className="score-stat">
            <span className="ss-val">{scoreData.recentIncidents || 0}</span>
            <span className="ss-key">Nearby incidents (500m)</span>
          </div>
        </div>
      )}

      {/* Safety advice */}
      {scoreData?.safetyAdvice?.length > 0 && (
        <div className="advice-list">
          {scoreData.safetyAdvice.slice(0, 3).map((tip, i) => (
            <div key={i} className="advice-item">{tip}</div>
          ))}
        </div>
      )}

      {/* Nearby help */}
      <div className="nearby-help">
        <h4>🆘 Nearest Help</h4>
        {nearbyHelp.police.length > 0 && (
          <div className="help-section">
            <span className="help-icon">👮</span>
            <div>
              <strong>{nearbyHelp.police[0]?.name}</strong>
              <small>{nearbyHelp.police[0]?.distance ? `${Math.round(nearbyHelp.police[0].distance)}m away` : 'Distance unknown'}</small>
            </div>
          </div>
        )}
        {nearbyHelp.hospital.length > 0 && (
          <div className="help-section">
            <span className="help-icon">🏥</span>
            <div>
              <strong>{nearbyHelp.hospital[0]?.name}</strong>
              <small>{nearbyHelp.hospital[0]?.distance ? `${Math.round(nearbyHelp.hospital[0].distance)}m away` : 'Distance unknown'}</small>
            </div>
          </div>
        )}
        {nearbyHelp.police.length === 0 && nearbyHelp.hospital.length === 0 && (
          <small className="no-help">Enable Google Maps API for live data</small>
        )}
      </div>

      <button className="refresh-score" onClick={fetchScore}>↻ Refresh</button>

      <style>{`
        .safety-score-widget {
          background: #1e1e2e; border: 1px solid #2d2d3e; border-radius: 16px;
          padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; min-width: 200px;
        }
        .score-ring-container { position: relative; display: inline-block; }
        .score-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
        .score-number { font-size: 22px; font-weight: 800; display: block; }
        .score-label { font-size: 10px; color: #64748b; }
        .score-loading { color: #64748b; font-size: 14px; }
        .risk-badge { border: 1px solid; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600; color: #e2e8f0; }
        .score-stats { width: 100%; }
        .score-stat { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #2d2d3e; font-size: 11px; }
        .ss-val { color: #e2e8f0; font-weight: 700; }
        .ss-key { color: #64748b; }
        .advice-list { width: 100%; display: flex; flex-direction: column; gap: 4px; }
        .advice-item { background: rgba(124,58,237,0.1); border-left: 3px solid #7c3aed; padding: 6px 8px; border-radius: 4px; font-size: 11px; color: #c4b5fd; }
        .nearby-help { width: 100%; }
        .nearby-help h4 { margin: 0 0 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase; }
        .help-section { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .help-icon { font-size: 20px; }
        .help-section strong { color: #e2e8f0; font-size: 12px; display: block; }
        .help-section small { color: #64748b; font-size: 10px; }
        .no-help { color: #64748b; font-size: 11px; }
        .refresh-score { background: none; border: 1px solid #2d2d3e; border-radius: 6px; color: #7c3aed; padding: 4px 12px; cursor: pointer; font-size: 11px; }
      `}</style>
    </div>
  );
};

export default SafetyScore;
