import React, { useState } from 'react';
import SOSButton from '../components/SOS/SOSButton';
import FakeCall from '../components/SOS/FakeCall';
import BottomNav from '../components/Layout/BottomNav';
import { useMotion } from '../hooks/useMotion';
import { usePanicVoice } from '../hooks/usePanicVoice';
import { useSafety } from '../context/SafetyContext';
import { Phone, Mic, Activity, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const SOSPage = () => {
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [fallDetection, setFallDetection] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { triggerSOS } = useSafety();

  const { requestPermission } = useMotion({
    enabled: fallDetection,
    onFallDetected: () => {
      toast.error('🆘 Fall detected! SOS in 30s...', { duration: 5000 });
    }
  });

  const { isListening, supported: voiceSupported } = usePanicVoice({
    enabled: voiceEnabled,
    onPanicDetected: (cmd) => {
      toast.error(`🎤 Panic: "${cmd}" — triggering SOS!`);
      triggerSOS(`Voice command: "${cmd}"`);
    }
  });

  const toggleFallDetection = async () => {
    if (!fallDetection) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Motion permission denied');
        return;
      }
    }
    setFallDetection(!fallDetection);
  };

  return (
    <div className="min-h-screen bg-dark-900 grid-bg pb-24">
      {showFakeCall && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: '#000' }}>
          <FakeCall onClose={() => setShowFakeCall(false)} />
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="font-mono text-xs text-white/40 uppercase tracking-widest">04 — Emergency</div>
        <h1 className="text-2xl font-display text-white mt-1">SOS CENTER</h1>
      </div>

      {/* Main SOS button */}
      <div className="flex justify-center py-8">
        <SOSButton />
      </div>

      {/* Quick action grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {/* Fake Call */}
        <button
          onClick={() => setShowFakeCall(true)}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:border-neon-blue/40 transition-all border border-white/5"
        >
          <Phone className="text-neon-blue" size={24} />
          <span className="text-white font-semibold text-sm">Fake Call</span>
          <span className="text-white/40 font-mono text-xs text-center">Escape unsafe situations</span>
        </button>

        {/* Voice Command */}
        <button
          onClick={() => voiceSupported && setVoiceEnabled(!voiceEnabled)}
          disabled={!voiceSupported}
          className={`glass-card p-4 flex flex-col items-center gap-2 transition-all border ${
            voiceEnabled
              ? 'border-neon-green/40 bg-neon-green/5'
              : 'border-white/5 hover:border-neon-green/20'
          } ${!voiceSupported ? 'opacity-40' : ''}`}
        >
          {voiceEnabled && isListening
            ? <Mic className="text-neon-green animate-pulse" size={24} />
            : <MicOff className="text-white/60" size={24} />
          }
          <span className="text-white font-semibold text-sm">
            {voiceEnabled ? 'Voice: ON' : 'Voice SOS'}
          </span>
          <span className="text-white/40 font-mono text-xs text-center">
            {voiceSupported ? 'Say "SOS" or "Help"' : 'Not supported'}
          </span>
        </button>

        {/* Fall Detection */}
        <button
          onClick={toggleFallDetection}
          className={`glass-card p-4 flex flex-col items-center gap-2 transition-all border ${
            fallDetection ? 'border-warning/40 bg-warning/5' : 'border-white/5 hover:border-warning/20'
          }`}
        >
          <Activity className={fallDetection ? 'text-warning animate-pulse' : 'text-white/60'} size={24} />
          <span className="text-white font-semibold text-sm">
            {fallDetection ? 'Fall: ON' : 'Fall Detect'}
          </span>
          <span className="text-white/40 font-mono text-xs text-center">Auto-SOS on fall</span>
        </button>

        {/* Share live */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'SafeZone', text: 'Track me live!', url: window.location.origin });
            }
          }}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:border-neon-blue/40 transition-all border border-white/5"
        >
          <span className="text-2xl">📤</span>
          <span className="text-white font-semibold text-sm">Share Live</span>
          <span className="text-white/40 font-mono text-xs text-center">Send your location</span>
        </button>
      </div>

      {/* Info */}
      <div className="px-4">
        <div className="glass-card p-4 border-l-2 border-neon-green/40">
          <p className="text-white/60 font-mono text-xs">
            🛡️ <span className="text-neon-green">Hold SOS button for 2 seconds</span> to trigger emergency alert.
            All trusted contacts will be notified with your live location instantly.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SOSPage;