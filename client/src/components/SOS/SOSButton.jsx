import React, { useState, useCallback, useRef } from 'react';
import { useSafety } from '../../context/SafetyContext';
import toast from 'react-hot-toast';

const HOLD_DURATION = 2000; // 2 second hold to prevent accidents

const SOSButton = () => {
  const { triggerSOS, cancelSOS, sosActive, myLocation } = useSafety();
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const holdTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  const startHold = useCallback(() => {
    if (sosActive) return;
    setHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setHoldProgress(Math.min((elapsed / HOLD_DURATION) * 100, 100));
    }, 30);

    holdTimerRef.current = setTimeout(async () => {
      clearInterval(progressTimerRef.current);
      setHolding(false);
      setHoldProgress(0);
      await triggerSOS();
    }, HOLD_DURATION);
  }, [sosActive, triggerSOS]);

  const cancelHold = useCallback(() => {
    clearTimeout(holdTimerRef.current);
    clearInterval(progressTimerRef.current);
    setHolding(false);
    setHoldProgress(0);
  }, []);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await cancelSOS();
    } finally {
      setCancelling(false);
    }
  }, [cancelSOS]);

  // Render active SOS state
  if (sosActive) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Active SOS indicator */}
        <div className="relative">
          <div className="w-44 h-44 rounded-full border-4 border-danger flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(255,51,102,0.3) 0%, rgba(255,51,102,0.1) 100%)',
              boxShadow: '0 0 50px rgba(255,51,102,0.6)',
              animation: 'pulse-sos 0.8s ease-in-out infinite'
            }}>
            {/* Ping rings */}
            <div className="absolute inset-0 rounded-full border-2 border-danger/30 animate-ping" />
            <div className="absolute inset-[-16px] rounded-full border border-danger/20 animate-ping" style={{ animationDelay: '0.3s' }} />

            <div className="text-center">
              <div className="text-4xl">🆘</div>
              <div className="text-danger font-display text-lg mt-1 font-bold tracking-widest">ACTIVE</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-danger font-mono text-sm animate-pulse">EMERGENCY BROADCAST ACTIVE</p>
          <p className="text-white/50 font-mono text-xs mt-1">Contacts notified · Location shared</p>
        </div>

        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="px-8 py-3 border border-white/30 text-white/70 font-mono text-sm hover:border-white/60 transition-all"
        >
          {cancelling ? 'CANCELLING...' : "✓ I'M SAFE — CANCEL SOS"}
        </button>
      </div>
    );
  }

  // Normal SOS button
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hold instruction */}
      <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
        {holding ? 'Hold to confirm...' : 'Hold 2s for emergency SOS'}
      </p>

      {/* SOS Button */}
      <div className="relative select-none">
        {/* Progress ring */}
        {holding && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
            <circle
              cx="88" cy="88" r="82"
              fill="none"
              stroke="rgba(255,51,102,0.8)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 82}`}
              strokeDashoffset={`${2 * Math.PI * 82 * (1 - holdProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.03s linear' }}
            />
          </svg>
        )}

        <button
          className="sos-btn"
          style={holding ? {
            borderColor: 'rgba(255,51,102,1)',
            boxShadow: '0 0 60px rgba(255,51,102,0.8)',
            animation: 'pulse-sos 0.5s ease-in-out infinite'
          } : {}}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          aria-label="Emergency SOS"
        >
          <div className="text-center pointer-events-none">
            <div className="text-5xl mb-1">🆘</div>
            <div className="text-danger font-display text-xl font-black tracking-widest"
              style={{ textShadow: '0 0 15px rgba(255,51,102,0.8)' }}>
              SOS
            </div>
          </div>
        </button>
      </div>

      {/* Location status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${myLocation ? 'bg-safe animate-pulse' : 'bg-warning'}`} />
        <span className="text-xs font-mono text-white/40">
          {myLocation ? `GPS: ${myLocation.lat?.toFixed(4)}, ${myLocation.lng?.toFixed(4)}` : 'Acquiring GPS...'}
        </span>
      </div>
    </div>
  );
};

export default SOSButton;
