import { useEffect, useRef, useCallback, useState } from 'react';
import { emitPanicVoice } from '../services/socket';

const PANIC_PHRASES = ['help me', 'sos', 'emergency', 'safezone sos', 'danger', 'help'];

export const usePanicVoice = ({ enabled = false, onPanicDetected } = {}) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      console.log('Voice heard:', transcript);

      emitPanicVoice(transcript);

      const isPanic = PANIC_PHRASES.some(phrase => transcript.includes(phrase));
      if (isPanic) {
        console.warn('🎤 Panic command detected:', transcript);
        onPanicDetected?.(transcript);
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto restart if still enabled
      if (enabled && recognitionRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    recognition.start();
    setIsListening(true);
  }, [enabled, onPanicDetected]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled && supported) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, supported]);

  return { isListening, supported };
};
