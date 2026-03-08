import React, { useState, useEffect } from 'react';
import FakeCall from '../components/SOS/FakeCall';
import { useMotion } from '../hooks/useMotion';
import { usePanicVoice } from '../hooks/usePanicVoice';
import { useSafety } from '../context/SafetyContext';
import toast from 'react-hot-toast';

// Animated SOS Button built inline — no overlap
const SOSBtn = ({ onTrigger }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let interval;
    if (holding && !triggered) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTriggered(true);
            setHolding(false);
            onTrigger();
            return 100;
          }
          return p + 5;
        });
      }, 100);
    } else if (!holding) {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [holding, triggered, onTrigger]);

  useEffect(() => {
    if (triggered) {
      let c = 30;
      setCountdown(c);
      const t = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(t);
          setTriggered(false);
          setCountdown(null);
        }
      }, 1000);
      return () => clearInterval(t);
    }
  }, [triggered]);

  const circumference = 2 * Math.PI * 72;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Pulse rings */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer rings */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: `${160 + i * 40}px`, height: `${160 + i * 40}px`,
            borderRadius: '50%',
            border: `1px solid rgba(255,51,102,${0.15 / i})`,
            animation: `pulse-ring ${1 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}

        {/* SVG progress ring */}
        <svg style={{ position: 'absolute', transform: 'rotate(-90deg)' }}
          width="168" height="168" viewBox="0 0 168 168">
          <circle cx="84" cy="84" r="72" fill="none"
            stroke="rgba(255,51,102,0.15)" strokeWidth="4" />
          <circle cx="84" cy="84" r="72" fill="none"
            stroke="#ff3366" strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>

        {/* Main button */}
        <button
          onMouseDown={() => !triggered && setHolding(true)}
          onMouseUp={() => setHolding(false)}
          onMouseLeave={() => setHolding(false)}
          onTouchStart={(e) => { e.preventDefault(); !triggered && setHolding(true); }}
          onTouchEnd={() => setHolding(false)}
          style={{
            width: '150px', height: '150px', borderRadius: '50%',
            background: triggered
              ? 'radial-gradient(circle, rgba(255,51,102,0.5), rgba(255,51,102,0.2))'
              : holding
                ? 'radial-gradient(circle, rgba(255,51,102,0.35), rgba(255,51,102,0.1))'
                : 'radial-gradient(circle, rgba(255,51,102,0.2), rgba(255,51,102,0.05))',
            border: `3px solid ${triggered ? '#ff3366' : 'rgba(255,51,102,0.6)'}`,
            boxShadow: triggered
              ? '0 0 60px rgba(255,51,102,0.8), inset 0 0 40px rgba(255,51,102,0.3)'
              : '0 0 30px rgba(255,51,102,0.4), inset 0 0 20px rgba(255,51,102,0.1)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '4px',
            transform: holding ? 'scale(0.95)' : 'scale(1)',
            transition: 'all 0.15s ease',
            userSelect: 'none', WebkitUserSelect: 'none',
            position: 'relative', zIndex: 1,
          }}
        >
          <span style={{ fontSize: '32px' }}>🆘</span>
          <span style={{
            fontFamily: "'Orbitron', monospace", fontSize: '20px', fontWeight: 900,
            color: '#ff3366', letterSpacing: '2px',
          }}>SOS</span>
          {triggered && countdown && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              Cancel in {countdown}s
            </span>
          )}
        </button>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        color: holding ? '#ff3366' : 'rgba(255,255,255,0.3)',
        transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        {triggered ? '🚨 SOS ACTIVE — HELP IS ON THE WAY' :
          holding ? `HOLD... ${Math.round(progress)}%` : 'HOLD 2S FOR EMERGENCY SOS'}
      </div>

      {triggered && (
        <button onClick={() => { setTriggered(false); setCountdown(null); toast.success('SOS cancelled'); }}
          style={{
            padding: '8px 24px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
          }}>
          CANCEL SOS
        </button>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, active, color = '#00c8ff', onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: active ? `rgba(${color === '#00ff88' ? '0,255,136' : color === '#ffaa00' ? '255,170,0' : '0,200,255'},0.08)` : 'rgba(10,22,40,0.6)',
      border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '12px', padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.3s ease',
      boxShadow: active ? `0 0 20px ${color}33` : 'none',
    }}>
    <span style={{
      fontSize: '28px',
      filter: active ? `drop-shadow(0 0 8px ${color})` : 'none',
      animation: active ? 'pulse-icon 1.5s ease-in-out infinite' : 'none',
    }}>{icon}</span>
    <span style={{
      color: active ? color : 'white', fontWeight: 600, fontSize: '14px',
      fontFamily: "'Rajdhani', sans-serif",
    }}>{title}</span>
    <span style={{
      color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px', textAlign: 'center', lineHeight: 1.4,
    }}>{desc}</span>
    {active && (
      <div style={{
        background: color, borderRadius: '10px', padding: '2px 10px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
        color: '#000', fontWeight: 700, textTransform: 'uppercase',
      }}>ACTIVE</div>
    )}
    <style>{`
      @keyframes pulse-icon {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    `}</style>
  </button>
);

const SOSPage = () => {
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fallDetection, setFallDetection] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { triggerSOS } = useSafety();

  const { requestPermission } = useMotion({
    enabled: fallDetection,
    onFallDetected: () => {
      toast.error('🆘 Fall detected! SOS triggered!', { duration: 5000 });
      triggerSOS('Fall detected by sensor');
    }
  });

  const { isListening, supported: voiceSupported } = usePanicVoice({
    enabled: voiceEnabled,
    onPanicDetected: (cmd) => {
      toast.error(`🎤 Voice: "${cmd}" — SOS triggered!`);
      triggerSOS(`Voice command: "${cmd}"`);
    }
  });

  const toggleFall = async () => {
    if (!fallDetection) {
      const granted = await requestPermission();
      if (!granted) { toast.error('Motion permission denied'); return; }
    }
    setFallDetection(f => !f);
    toast.success(fallDetection ? 'Fall detection off' : '⚡ Fall detection active!');
  };

  const handleSOSTrigger = () => {
    triggerSOS('Manual SOS');
    toast.error('🚨 SOS TRIGGERED! Contacts notified!', { duration: 6000 });
  };

  const shareLocation = () => {
    if (navigator.share) {
      navigator.share({ title: 'SafeZone Live', text: 'Track my location live!', url: window.location.origin });
    } else {
      navigator.clipboard?.writeText(window.location.origin);
      toast.success('Link copied!');
    }
  };

  return (
    <>
      {/* FakeCall rendered as full overlay — outside main layout */}
      {showFakeCall && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <FakeCall onClose={() => setShowFakeCall(false)} />
        </div>
      )}

      <div style={{
        minHeight: '100vh', background: '#050d14',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(255,51,102,0.05) 0%, transparent 60%)',
        paddingBottom: '90px', fontFamily: "'Rajdhani', sans-serif",
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 8px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
            color: 'rgba(255,51,102,0.5)', marginBottom: '4px', letterSpacing: '0.1em',
          }}>04 — EMERGENCY</div>
          <h1 style={{
            fontFamily: "'Orbitron', monospace", fontSize: '24px',
            color: 'white', margin: 0, letterSpacing: '2px',
          }}>SOS CENTER</h1>
        </div>

        {/* SOS Button */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px 24px' }}>
          <SOSBtn onTrigger={handleSOSTrigger} />
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px', padding: '0 16px 20px',
        }}>
          <FeatureCard
            icon="📞" title="Fake Call" color="#00c8ff"
            desc="Trigger a fake incoming call to escape unsafe situations"
            onClick={() => setShowFakeCall(true)}
          />
          <FeatureCard
            icon={voiceEnabled && isListening ? '🎙️' : '🎤'}
            title={voiceEnabled ? 'Voice: ON' : 'Voice SOS'}
            color="#00ff88" active={voiceEnabled}
            desc={voiceSupported ? 'Say "SOS" or "Help"' : 'Not supported in this browser'}
            disabled={!voiceSupported}
            onClick={() => { setVoiceEnabled(v => !v); toast.success(voiceEnabled ? 'Voice SOS off' : '🎤 Listening for "SOS"!'); }}
          />
          <FeatureCard
            icon={fallDetection ? '📳' : '📱'}
            title={fallDetection ? 'Fall: ON' : 'Fall Detect'}
            color="#ffaa00" active={fallDetection}
            desc="Auto-SOS when phone detects sudden impact or fall"
            onClick={toggleFall}
          />
          <FeatureCard
            icon="📤" title="Share Live" color="#a855f7"
            desc="Send your live location link to someone instantly"
            onClick={shareLocation}
          />
        </div>

        {/* Info bar */}
        <div style={{ padding: '0 16px' }}>
          <div style={{
            background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(0,255,136,0.15)',
            borderLeft: '3px solid rgba(0,255,136,0.6)',
            borderRadius: '8px', padding: '14px 16px',
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', margin: 0, lineHeight: 1.6,
            }}>
              🛡️ <span style={{ color: '#00ff88' }}>Hold SOS for 2 seconds</span> to trigger emergency alert.
              All trusted contacts will be notified with your live location instantly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SOSPage;
