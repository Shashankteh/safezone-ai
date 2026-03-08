import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, X } from 'lucide-react';

const FAKE_CALLERS = [
  { name: 'Mom', number: '+91 98765 43210', avatar: '👩' },
  { name: 'Dad', number: '+91 87654 32109', avatar: '👨' },
  { name: 'Rahul (Friend)', number: '+91 76543 21098', avatar: '👤' },
  { name: 'Police Station', number: '100', avatar: '👮' },
  { name: 'Custom...', number: '', avatar: '✏️' },
];

const FakeCall = ({ onClose }) => {
  const [phase, setPhase] = useState('setup'); // setup → ringing → ongoing → ended
  const [selectedCaller, setSelectedCaller] = useState(FAKE_CALLERS[0]);
  const [delay, setDelay] = useState(5);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const callTimerRef = useRef(null);

  const startFakeCall = () => {
    setPhase('ringing');
    // Auto-answer after delay
    timerRef.current = setTimeout(() => {
      setPhase('ongoing');
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }, delay * 1000);
  };

  const endCall = () => {
    clearTimeout(timerRef.current);
    clearInterval(callTimerRef.current);
    setPhase('ended');
    setTimeout(onClose, 1500);
  };

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(callTimerRef.current);
    };
  }, []);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="fixed inset-0 z-50 bg-dark-900/95 flex flex-col items-center justify-center p-6">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white">
          <X size={24} />
        </button>

        <div className="text-3xl mb-2">📞</div>
        <h2 className="text-xl font-display text-white mb-1">Fake Call</h2>
        <p className="text-white/50 font-mono text-xs mb-8 text-center">
          Trigger a fake incoming call to escape unsafe situations
        </p>

        {/* Caller selection */}
        <div className="w-full max-w-sm space-y-2 mb-6">
          <p className="text-white/60 font-mono text-xs uppercase mb-3">Choose caller:</p>
          {FAKE_CALLERS.map((caller) => (
            <button
              key={caller.name}
              onClick={() => setSelectedCaller(caller)}
              className={`w-full flex items-center gap-3 px-4 py-3 border transition-all ${
                selectedCaller.name === caller.name
                  ? 'border-neon-green bg-neon-green/5 text-neon-green'
                  : 'border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              <span className="text-2xl">{caller.avatar}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{caller.name}</div>
                <div className="text-xs opacity-60">{caller.number}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Delay */}
        <div className="w-full max-w-sm mb-6">
          <p className="text-white/60 font-mono text-xs uppercase mb-2">
            Call in: <span className="text-neon-green">{delay}s</span>
          </p>
          <input
            type="range" min="3" max="30" value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="w-full accent-green-400"
          />
        </div>

        <button onClick={startFakeCall} className="neon-btn-primary w-full max-w-sm py-4 text-base">
          📞 Start Fake Call
        </button>
      </div>
    );
  }

  // Ringing screen
  if (phase === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center">
        <div className="text-center">
          {/* Avatar with pulse */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-5xl
              ring-4 ring-white/20 animate-pulse">
              {selectedCaller.avatar}
            </div>
            <div className="absolute inset-0 rounded-full ring-8 ring-white/10 animate-ping" />
          </div>

          <p className="text-white/70 text-sm font-mono mb-2">incoming call...</p>
          <h1 className="text-3xl font-bold text-white mb-1">{selectedCaller.name}</h1>
          <p className="text-white/50 text-sm">{selectedCaller.number}</p>
        </div>

        {/* Call controls */}
        <div className="flex gap-16 mt-16">
          <button onClick={endCall}
            className="w-16 h-16 rounded-full bg-danger flex items-center justify-center">
            <PhoneOff className="text-white" size={24} />
          </button>
          <button onClick={() => setPhase('ongoing')}
            className="w-16 h-16 rounded-full bg-safe flex items-center justify-center animate-bounce">
            <Phone className="text-black" size={24} />
          </button>
        </div>
        <div className="mt-4 text-white/40 text-xs font-mono">Slide to answer</div>
      </div>
    );
  }

  // Ongoing call
  if (phase === 'ongoing') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-between py-16">
        <div className="text-center">
          <p className="text-safe font-mono text-sm mb-2">{formatTime(elapsed)}</p>
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-4">
            {selectedCaller.avatar}
          </div>
          <h1 className="text-2xl font-bold text-white">{selectedCaller.name}</h1>
          <p className="text-white/50 text-sm mt-1">Connected</p>
        </div>

        {/* Fake audio wave */}
        <div className="flex items-center gap-1 h-12">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 bg-safe/60 rounded-full"
              style={{
                height: `${20 + Math.random() * 24}px`,
                animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        <button onClick={endCall}
          className="w-16 h-16 rounded-full bg-danger flex items-center justify-center">
          <PhoneOff className="text-white" size={24} />
        </button>
      </div>
    );
  }

  // Ended
  return (
    <div className="fixed inset-0 z-50 bg-dark-900/95 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">📵</div>
        <p className="text-white/60 font-mono">Call Ended</p>
      </div>
    </div>
  );
};

export default FakeCall;
