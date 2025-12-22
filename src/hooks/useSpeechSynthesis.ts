import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Preferred voices for natural sound (prioritized)
const PREFERRED_VOICES = [
  'Samantha', // macOS - very natural
  'Karen',    // macOS Australian
  'Daniel',   // macOS British
  'Moira',    // macOS Irish
  'Tessa',    // macOS South African
  'Fiona',    // macOS Scottish
  'Microsoft Zira',  // Windows
  'Microsoft David', // Windows
  'Google US English', // Chrome
];

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const { onEnd, rate = 1, pitch = 1, volume = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const voiceSelectedRef = useRef(false);

  // Load voices (only select once)
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      // Only select voice once
      if (voiceSelectedRef.current) return;
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Find the best voice
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        
        // Try to find a preferred voice
        let bestVoice: SpeechSynthesisVoice | null = null;
        for (const preferredName of PREFERRED_VOICES) {
          bestVoice = englishVoices.find(v => 
            v.name.includes(preferredName)
          ) || null;
          if (bestVoice) break;
        }
        
        // Fallback: prefer local voices over remote (more natural)
        if (!bestVoice) {
          bestVoice = englishVoices.find(v => v.localService) || englishVoices[0] || voices[0];
        }
        
        if (bestVoice) {
          setSelectedVoice(bestVoice);
          voiceSelectedRef.current = true;
          console.log('Selected voice:', bestVoice.name, bestVoice.lang);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      return;
    }

    // If already speaking, cancel first but mark that we're intentionally canceling
    if (isSpeakingRef.current || window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      // Clear the old utterance's callbacks to prevent them from firing
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Use selected voice if available
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (onEnd) {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      // Ignore "interrupted" and "canceled" - these are expected when we cancel
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      console.error('Speech error:', event.error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (onEnd) {
        onEnd();
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [rate, pitch, volume, onEnd, selectedVoice]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      // Clear callbacks before canceling
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        if (utteranceRef.current) {
          utteranceRef.current.onend = null;
          utteranceRef.current.onerror = null;
        }
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
  };
};
