import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, duration?: number) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const { onResult, onError, continuous = false, interimResults = false } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const shouldBeListeningRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Always use continuous mode internally
    recognition.interimResults = interimResults;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Speech] Recognition started');
      setIsListening(true);
      setError(null);
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current += finalTranscript;
        const fullTranscript = accumulatedTranscriptRef.current.trim();
        setTranscript(fullTranscript);
        console.log('[Speech] Final transcript:', fullTranscript);

        if (onResult) {
          const duration = (Date.now() - startTimeRef.current) / 1000;
          // Reset for next utterance
          accumulatedTranscriptRef.current = '';
          startTimeRef.current = Date.now();
          onResult(fullTranscript, duration);
        }
      } else if (interimTranscript) {
        setTranscript(accumulatedTranscriptRef.current + interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('[Speech] Error:', event.error);

      // Ignore these errors in continuous listening mode
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('[Speech] Recognition ended, shouldBeListening:', shouldBeListeningRef.current);
      setIsListening(false);

      // Auto-restart if we should still be listening
      if (shouldBeListeningRef.current) {
        setTimeout(() => {
          if (shouldBeListeningRef.current && recognitionRef.current) {
            try {
              console.log('[Speech] Auto-restarting...');
              recognitionRef.current.start();
            } catch (err) {
              console.log('[Speech] Restart failed, retrying...', err);
              // Retry once more after a delay
              setTimeout(() => {
                if (shouldBeListeningRef.current && recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e) {
                    console.error('[Speech] Failed to restart:', e);
                  }
                }
              }, 500);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    console.log('[Speech] startListening called');
    shouldBeListeningRef.current = true;
    accumulatedTranscriptRef.current = '';
    startTimeRef.current = Date.now();
    setTranscript('');
    setError(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Might already be running, try stopping and starting
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (shouldBeListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('[Speech] Failed to start:', e);
              }
            }
          }, 100);
        } catch (e) {
          console.error('[Speech] Failed to restart:', e);
        }
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('[Speech] stopListening called');
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
